import './schemaGenerator.js'

function displaySchema(schemaHtml) {
  const schemaContainer = document.getElementById('schema-content')
  schemaContainer.innerHTML = `${schemaHtml}`
}

document.addEventListener('DOMContentLoaded', () => {
  // Establish a connection to the service worker
  const port = chrome.runtime.connect({ name: 'panel-connection' })

  // Listen for messages from the service worker
  port.onMessage.addListener((message) => {
    if (message.from === 'service-worker') {
      console.log('Message received from service worker:', message.message)
      switch (message.message) {
        case 'close':
          // Closing the side panel
          window.close()
          break
        case 'tree':
          // Inject the tree into the sidepanel
          const schemaHtml = window.generateSchemaHtml(message.content)
          displaySchema(schemaHtml.outerHTML)
          break
      }
    }
  })
})
