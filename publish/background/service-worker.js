// Schema tab
let schemaTabId = undefined

const closeSidePanel = async () => {
  console.log('Sending close message to side panel')
  chrome.runtime
    .sendMessage({
      from: 'service-worker',
      message: 'close-side-panel',
    })
    .then(() => (schemaTabId = undefined))
    .catch((error) => console.error(error))
}

const scanCurrentPage = async () => {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    chrome.runtime.sendMessage({
      from: 'service-worker',
      message: 'title',
      content: tabs[0].title,
    })

    // Only handle certain pages
    const permittedProtocols = ['http:', 'https:']
    const tabProtocol = new URL(tabs[0].url)?.protocol
    if (permittedProtocols.includes(tabProtocol)) {
      schemaTabId = tabs[0].id
      // Execute the script
      chrome.scripting
        .executeScript({
          target: { tabId: schemaTabId },
          func: runTreeBuilder,
        })
        .then((answers) => {
          chrome.runtime
            .sendMessage({
              from: 'service-worker',
              message: 'tree',
              content: answers[0].result,
            })
            .catch((error) => console.log(error))
        })
        .catch((error) => console.log(error))
      chrome.scripting
        .executeScript({
          target: { tabId: schemaTabId },
          func: runValidator,
        })
        .then((answers) => {
          chrome.runtime
            .sendMessage({
              from: 'service-worker',
              message: 'validation',
              content: answers[0].result,
            })
            .catch((error) => console.log(error))
        })
        .catch((error) => console.log(error))
    } else {
      chrome.runtime.sendMessage({
        from: 'service-worker',
        message: 'reset-schema',
      })
    }
  })
}

let isSidePanelOpen = false

chrome.runtime.onInstalled.addListener(() => {
  console.log(`Extension version: ${chrome.runtime.getManifest().version}`)
  if (chrome.runtime.getManifest()?.env?.DEBUG || false) {
    // Handle refresh issues when debugging
    const debugUrl = chrome.runtime.getManifest().env.DEBUGURL
    chrome.tabs
      .query({
        url: debugUrl,
      })
      .then((tabs) => {
        if (tabs.length === 0) {
          chrome.tabs
            .update({
              url: debugUrl,
            })
            .then(() => chrome.runtime.reload())
        }
      })
  }

  chrome.action.onClicked.addListener(async (tab) => {
    if (isSidePanelOpen) {
      closeSidePanel()
      // isSidePanelOpen managed when receiving the `closing` message
    } else {
      await chrome.sidePanel.open({ windowId: tab.windowId }).then(() => {
        isSidePanelOpen = true
      })
    }
  })
})

chrome.tabs.onUpdated.addListener(() => {
  scanCurrentPage()
})

chrome.tabs.onActivated.addListener(() => {
  closeSidePanel()
})

chrome.runtime.onMessage.addListener((message) => {
  if (message.from === 'side-panel') {
    console.log(`Message from ${message.from}: ${message.message}`)
    switch (message.message) {
      case 'closing':
        isSidePanelOpen = false
        break
      case 'loaded':
        scanCurrentPage()
        break
      case 'highlight':
        chrome.tabs.sendMessage(schemaTabId, {
          from: 'service-worker',
          message: 'highlight',
          elementId: message.elementId, // Match the case from side panel
        })
        break
    }
  }
})

// Content script injections
const runTreeBuilder = () => {
  console.log('Instantiating the tree builder')
  return treeBuilder.htmlDocumentToTree()
}

const runValidator = () => {
  console.log('Instantiating the validator')
  const validator = new HTMLValidator(rulesConfig)
  return validator.validate()
}
