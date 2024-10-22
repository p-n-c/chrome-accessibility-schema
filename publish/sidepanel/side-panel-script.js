document.addEventListener('DOMContentLoaded', () => {
  // Establish a connection to the service worker
  const port = chrome.runtime.connect({ name: 'panel-connection' })

  // Listen for messages from the service worker
  port.onMessage.addListener((message) => {
    if (message.from === 'service-worker') {
      console.log('Message received from service worker:', message.message)
      if (message.message === 'close') {
        // Closing the side panel
        window.close()
      }
    }
  })
})
