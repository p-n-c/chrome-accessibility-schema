let schemaTabId = undefined
let isSidePanelOpen = false
let elementId = false

const closeSidePanel = async () => {
  try {
    chrome.runtime.sendMessage({
      from: 'service-worker',
      message: 'close-side-panel',
    })
    chrome.tabs.sendMessage(schemaTabId, {
      from: 'service-worker',
      message: 'highlight',
      elementId,
    })
    schemaTabId = undefined
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

    await chrome.runtime.sendMessage({
      from: 'service-worker',
      message: 'title',
      content: currentTab.title,
    })

    const permittedProtocols = ['http:', 'https:']
    const tabProtocol = new URL(currentTab.url)?.protocol
    if (permittedProtocols.includes(tabProtocol)) {
      schemaTabId = currentTab?.id
      const treeResult = await executeScriptAndSendMessage({
        tabId: schemaTabId,
        func: runTreeBuilder,
        messageType: 'tree',
      })

      if (treeResult) {
        await executeScriptAndSendMessage({
          tabId: schemaTabId,
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

chrome.action.onClicked.addListener((tab) => {
  console.log('Visitor clicked on icon')
  if (isSidePanelOpen) {
    closeSidePanel()
  } else {
    chrome.sidePanel.open({ windowId: tab.windowId })
  }
  // Toggle side panel visibility
  isSidePanelOpen = !isSidePanelOpen
})

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tabs) => {
  if (changeInfo.status === 'complete') {
    scanCurrentPage()
  }
})

chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log('Tab switched. New active tab ID:', activeInfo.tabId)
  // Close the side panel
  closeSidePanel()
  // And therefore set panel closed to true
  isSidePanelOpen = false
})

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.from === 'side-panel') {
    console.log(`Message from ${message.from}: ${message.message}`)

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    const currentTab = tabs[0]
    schemaTabId = currentTab?.id
    elementId = message.elementId

    switch (message.message) {
      case 'loaded':
        scanCurrentPage()
        break
      case 'highlight':
        chrome.tabs.sendMessage(schemaTabId, {
          from: 'service-worker',
          message: 'highlight',
          elementId: message.elementId,
        })
        break
      default:
        // do nothing
        break
    }
  }
})

// Content script injections
const runTreeBuilder = () => {
  return treeBuilder.htmlDocumentToTree()
}

const runValidator = () => {
  const validator = new HTMLValidator(rulesConfig)
  return validator.validate()
}
