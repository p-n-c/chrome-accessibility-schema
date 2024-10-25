let isSidePanelOpen = false
let sidePanelPort = null

const runTreeBuilder = () => {
  // Use treeBuilder here on a fully loaded DOM
  const result = treeBuilder.htmlDocumentToTree()
  return result
}

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

chrome.runtime.onMessage.addListener((message, sender) => {
  const tab = sender.tab
  if (message.from === 'content-script') {
    if (message.message === 'content-loaded') {
      chrome.scripting
        .executeScript({
          target: { tabId: tab.id },
          func: runTreeBuilder,
        })
        .then((tree) => {
          console.log('Script out:', JSON.stringify(tree, '', 2))
        })
        .catch((error) => console.log(error))
    }
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
  // Side panel closed
  port.onDisconnect.addListener(() => {
    sidePanelPort = null
    console.log('Side panel disconnected')
    isSidePanelOpen = false
  })
})
