let isSidePanelOpen = false
let sidePanelPort = null

chrome.action.onClicked.addListener((tab) => {
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
