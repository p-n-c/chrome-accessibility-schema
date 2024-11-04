let DEBUG = true
let debugUrl =
  'https://p-n-c.github.io/website/accessibility/bad-test-card.html'

const closeSidePanel = async () => {
  console.log('Sending close message to side panel')
  chrome.runtime
    .sendMessage({
      from: 'service-worker',
      message: 'close-side-panel',
    })
    .catch((error) => console.error(error))
}

const scanCurrentPage = async () => {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const tabId = tabs[0].id

    // Execute the script
    chrome.scripting
      .executeScript({
        target: { tabId },
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
        target: { tabId },
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
  })
}

let isSidePanelOpen = false
chrome.runtime.onInstalled.addListener(() => {
  console.log(`Extension version: ${chrome.runtime.getManifest().version}`)
  if (DEBUG) {
    // Handle refresh issues when debugging
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
    console.log(isSidePanelOpen)
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
        chrome.tabs.update(schemaTab.id, { active: true })
        chrome.tabs.sendMessage(schemaTab.id, {
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
  const validator = new HTMLValidator(rulesConfig, ruleHandlers)
  return validator.validate()
}
