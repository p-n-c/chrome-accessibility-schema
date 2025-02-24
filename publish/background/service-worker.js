const storageCache = {
  schemaTabId: undefined,
  isSidePanelOpen: false,
  elementId: false,
}

const initStorageCache = chrome.storage.local.get().then((items) => {
  Object.assign(storageCache, items)
})

const closeSidePanel = async () => {
  try {
    chrome.tabs.sendMessage(storageCache.schemaTabId, {
      from: 'service-worker',
      message: 'highlight',
      elementId: storageCache.elementId,
    })
    chrome.runtime.sendMessage({
      from: 'service-worker',
      message: 'close-side-panel',
    })
    storageCache.schemaTabId = undefined
  } catch (error) {
    console.error(error)
  }
}

const executeScriptAndSendMessage = async ({
  tabId,
  func,
  messageType,
  forceSendMessage = false,
}) => {
  try {
    const answers = await chrome.scripting.executeScript({
      target: { tabId },
      func,
    })
    const result = answers[0].result
    // When validating, there may be no result to check (0 errors)
    const sendMessage =
      (result && Object.keys(result).length !== 0) || forceSendMessage

    if (sendMessage) {
      await chrome.runtime.sendMessage({
        from: 'service-worker',
        message: messageType,
        content: result,
      })
      return true
    }
    return false
  } catch (error) {
    console.log(error)
    return false
  }
}

const scanCurrentPage = async () => {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    const currentTab = tabs[0]

    // Find the page meta title
    await chrome.runtime.sendMessage({
      from: 'service-worker',
      message: 'title',
      content: currentTab?.title,
    })

    const permittedProtocols = ['http:', 'https:']
    const tabProtocol = new URL(currentTab.url)?.protocol
    if (permittedProtocols.includes(tabProtocol)) {
      storageCache.schemaTabId = currentTab?.id
      // Build the schema tree
      const treeResult = await executeScriptAndSendMessage({
        tabId: storageCache.schemaTabId,
        func: runTreeBuilder,
        messageType: 'tree',
      })

      // Once the tree has been built, validate it
      if (treeResult) {
        await executeScriptAndSendMessage({
          tabId: storageCache.schemaTabId,
          func: runValidator,
          messageType: 'validation',
          forceSendMessage: true,
        })
      } else {
        return
      }
    } else {
      await chrome.runtime.sendMessage({
        from: 'service-worker',
        message: 'reset-schema',
      })
    }
  } catch (error) {
    console.error('Error in scan current page:', error)
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  // Visitor clicks on the extension icon
  chrome.sidePanel.open({ windowId: tab.windowId })
  await initStorageCache
  if (storageCache.isSidePanelOpen) {
    // Can't be run outside the if statement because
    // the sidePanel.open method has to be first in the event listener
    closeSidePanel()
  }
  // Toggle side panel visibility
  storageCache.isSidePanelOpen = !storageCache.isSidePanelOpen
  chrome.storage.local.set(storageCache)
})

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tabs) => {
  await initStorageCache
  if (changeInfo.status === 'complete') {
    scanCurrentPage()
  }
  chrome.storage.local.set(storageCache)
})

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await initStorageCache
  // When the visitor goes to another tab, we close the panel
  if (storageCache.isSidePanelOpen) {
    closeSidePanel()
  }
  storageCache.isSidePanelOpen = false
  chrome.storage.local.set(storageCache)
})

chrome.runtime.onMessage.addListener(async (message) => {
  await initStorageCache
  if (message.from === 'side-panel') {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    const currentTab = tabs[0]
    storageCache.schemaTabId = currentTab?.id
    storageCache.elementId = message.elementId

    switch (message.message) {
      // When the page loads, we build the schema tree
      case 'loaded':
        scanCurrentPage()
        break
      // When the visitor clicks on an element in the schema, we highlight it on the page
      case 'highlight':
        chrome.tabs.sendMessage(storageCache.schemaTabId, {
          from: 'service-worker',
          message: 'highlight',
          elementId: message.elementId,
        })
        break
    }
  }
  chrome.storage.local.set(storageCache)
})

// Content script injections (see manifest)
const runTreeBuilder = () => {
  return treeBuilder.htmlDocumentToTree()
}

const runValidator = () => {
  const validator = new HTMLValidator(rulesConfig)
  return validator.validate()
}
