import './schemaGenerator.js'

function displaySchema(schemaHtml) {
  const schemaContainer = document.getElementById('schema-content')
  schemaContainer.innerHTML = `${schemaHtml}`
}

function extendSelectionToWord(selection) {
  selection.modify('move', 'backward', 'word')
  selection.modify('extend', 'forward', 'word')
}

function openOrReloadWindow(url, windowName) {
  const parsedUrl = new URL(url)
  const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`
  const existingWindow = window.open('', windowName)
  if (existingWindow) {
    existingWindow.location.href = url
  } else {
    window.open(url, windowName)
  }
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

  // MDN Context menu
  chrome.contextMenus.create(
    {
      id: 'mdn-consult',
      title: 'Search MDN for "%s"',
      contexts: ['selection'],
      documentUrlPatterns: [
        `chrome-extension://${chrome.runtime.id}/sidepanel/side-panel.html`,
      ],
    },
    () => {
      if (chrome.runtime.lastError) {
        // The menu item already exists, we can safely ignore this error
      }
    }
  )
  document.addEventListener('contextmenu', () => {
    let selection = document.getSelection()
    if (selection.anchorNode.parentElement.classList.contains('tag')) {
      extendSelectionToWord(selection)
    }
  })
  chrome.contextMenus.onClicked.addListener(function (info) {
    if (info.menuItemId === 'mdn-consult') {
      const selection = document.getSelection()
      const selectedText = selection.toString()
      openOrReloadWindow(
        `https://developer.mozilla.org/en-US/docs/Web/HTML/Element/${selectedText}`,
        'mdn-from-sidepanel'
      )
    }
  })

  document.getElementById('generate-schema').addEventListener('click', () => {
    port.postMessage({
      from: 'side-panel',
      message: 'generate-schema',
    })
  })
})
