let DEBUG = true
let debugUrl =
  'https://p-n-c.github.io/website/accessibility/bad-test-card.html'

let isSidePanelOpen = false
let sidePanelPort = null
let schemaTab = null

chrome.runtime.onInstalled.addListener(() => {
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
})

chrome.action.onClicked.addListener(async (tab) => {
  console.log(chrome.runtime.getManifest().version)
  if (isSidePanelOpen) {
    // Tell the side panel to close
    try {
      sidePanelPort.postMessage({
        from: 'service-worker',
        message: 'close',
      })
      console.log('Closing side panel')
    } catch (error) {
      console.error('Error sending "close" message:', error)
    }
  } else {
    // Open the side panel
    chrome.sidePanel.setOptions({ enabled: true })
    chrome.sidePanel.open({ windowId: tab.windowId })
    isSidePanelOpen = true
    console.log('Side panel open')
  }
})

chrome.runtime.onConnect.addListener((port) => {
  console.log('Connected to panel')
  sidePanelPort = port
  // Send a message to the panel via the port
  if (port.name === 'panel-connection') {
    port.postMessage({
      from: 'service-worker',
      message: 'Hello from the service worker',
    })
  }
  sidePanelPort.onMessage.addListener((message) => {
    if (message.from === 'side-panel') {
      switch (message.message) {
        case 'generate-schema':
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            schemaTab = tabs[0]

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

  // Side panel closed
  port.onDisconnect.addListener(() => {
    sidePanelPort = null
    console.log('Side panel disconnected')
    chrome.sidePanel.setOptions({ enabled: false })
    isSidePanelOpen = false
    schemaTab = null
  })
})

// Content script injections
const runTreeBuilder = () => {
  return treeBuilder.htmlDocumentToTree()
}

const runValidator = () => {
  console.log('Instantiating the validator 5')
  const validator = new HTMLValidator(rulesConfig, ruleHandlers)
  return validator.validate()
}
