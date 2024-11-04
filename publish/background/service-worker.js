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

const scanCurrentPage = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    schemaTab = sender.tabs[0]

    // Create one-time listener for tab update
    const onTabUpdate = (tabId, changeInfo, updatedTab) => {
      // Only proceed if this is our tab and it's done loading
      if (tabId === schemaTab.id && changeInfo.status === 'complete') {
        // Remove the listener since we only need it once
        chrome.tabs.onUpdated.removeListener(onTabUpdate)

        // Execute the script
        chrome.scripting
          .executeScript({
            target: { tabId },
            func: runTreeBuilder,
          })
          .then((answers) => {
            sidePanelPort.postMessage({
              from: 'service-worker',
              message: 'tree',
              content: answers[0].result,
            })
          })
          .catch((error) => console.log(error))
        chrome.scripting
          .executeScript({
            target: { tabId },
            func: runValidator,
          })
          .then((answers) => {
            sidePanelPort.postMessage({
              from: 'service-worker',
              message: 'validation',
              content: answers[0].result,
            })
          })
      }
    }

    // Add the listener before reloading
    chrome.tabs.onUpdated.addListener(onTabUpdate)
    // Reload the tab
    chrome.tabs.reload(schemaTab.id)
  })
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.from === 'side-panel') {
    console.log(`Message from ${message.from}: ${message.message}`)
    switch (message.message) {
      case 'closing':
        isSidePanelOpen = false
        break
      case 'generate-schema':
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
  return treeBuilder.htmlDocumentToTree()
}

const runValidator = () => {
  console.log('Instantiating the validator')
  const validator = new HTMLValidator(rulesConfig, ruleHandlers)
  return validator.validate()
}
