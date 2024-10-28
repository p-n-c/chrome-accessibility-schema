let isSidePanelOpen = false
let sidePanelPort = null

chrome.action.onClicked.addListener(async (tab) => {
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
    chrome.sidePanel.open({ windowId: tab.windowId })
    isSidePanelOpen = true
    console.log('Side panel open')
  }
})

// chrome.runtime.onMessage.addListener((message, sender) => {
//   if (isSidePanelOpen) {
//     const tab = sender.tab
//     if (message.from === 'content-script') {
//       if (message.message === 'content-loaded') {
//         chrome.scripting
//           .executeScript({
//             target: { tabId: tab.id },
//             func: runTreeBuilder,
//           })
//           .then((answers) => {
//             sidePanelPort.postMessage({
//               from: 'service-worker',
//               message: 'tree',
//               content: answers[0].result,
//             })
//           })
//           .catch((error) => console.log(error))
//       }
//     }
//   }
// })

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
            const tab = tabs[0]

            // Create one-time listener for tab update
            const onTabUpdate = (tabId, changeInfo, updatedTab) => {
              // Only proceed if this is our tab and it's done loading
              if (tabId === tab.id && changeInfo.status === 'complete') {
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
              }
            }

            // Add the listener before reloading
            chrome.tabs.onUpdated.addListener(onTabUpdate)
            // Reload the tab
            chrome.tabs.reload(tab.id)
          })
          break
      }
    }
  })

  // Side panel closed
  port.onDisconnect.addListener(() => {
    sidePanelPort = null
    console.log('Side panel disconnected')
    isSidePanelOpen = false
  })
})

// Content script injections
const runTreeBuilder = () => {
  console.log('Running htmlDocumentToTree')
  return htmlDocumentToTree()
}
