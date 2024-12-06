let schemaTabId = undefined
let isSidePanelOpen = false

const closeSidePanel = async () => {
  try {
    await chrome.runtime.sendMessage({
      from: 'service-worker',
      message: 'close-side-panel',
    })
    isSidePanelOpen = false
    schemaTabId = undefined
  } catch (error) {
    console.error(error)
  }
}

const executeScriptAndSendMessage = async (tabId, func, messageType) => {
  try {
    const answers = await chrome.scripting.executeScript({
      target: { tabId },
      func,
    })

    const result = answers[0].result
    if (result && Object.keys(result).length !== 0) {
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

    console.log('tabs: ', tabs)

    await chrome.runtime.sendMessage({
      from: 'service-worker',
      message: 'title',
      content: currentTab.title,
    })

    const permittedProtocols = ['http:', 'https:']
    const tabProtocol = new URL(currentTab.url)?.protocol
    console.log('tabProtocol: ', tabProtocol)
    if (permittedProtocols.includes(tabProtocol)) {
      schemaTabId = currentTab.id
      console.log('schemaTabId: ', schemaTabId)
      const treeResult = await executeScriptAndSendMessage(
        schemaTabId,
        runTreeBuilder,
        'tree'
      )
      if (treeResult) {
        await executeScriptAndSendMessage(
          schemaTabId,
          runValidator,
          'validation'
        )
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
    console.error('Error in scanCurrentPage:', error)
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  chrome.action.onClicked.addListener(async (tab) => {
    if (isSidePanelOpen) {
      await closeSidePanel()
    } else {
      try {
        await chrome.sidePanel.open({ windowId: tab.windowId })
        isSidePanelOpen = true
        schemaTabId = tab.id
      } catch (error) {
        console.error('Error opening side panel:', error)
        isSidePanelOpen = false
      }
    }
  })
})

chrome.tabs.onUpdated.addListener(async () => {
  if (isSidePanelOpen) await scanCurrentPage()
})

chrome.tabs.onActivated.addListener(async () => {
  if (isSidePanelOpen) await closeSidePanel()
})

chrome.runtime.onMessage.addListener((message) => {
  if (message.from === 'side-panel') {
    console.log(`Message from ${message.from}: ${message.message}`)

    switch (message.message) {
      case 'closing':
        isSidePanelOpen = false
        schemaTabId = undefined
        break
      case 'loaded':
        isSidePanelOpen = true
        scanCurrentPage()
        break
      case 'highlight':
        chrome.tabs.sendMessage(schemaTabId, {
          from: 'service-worker',
          message: 'highlight',
          elementId: message.elementId,
        })
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
