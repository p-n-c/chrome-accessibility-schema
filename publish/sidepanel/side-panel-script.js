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
  let port = chrome.runtime.connect({ name: 'panel-connection' })
  // If disconnection, attempt to reconnect
  port.onDisconnect.addListener(() => {
    document.querySelector('main').classList.add('disabled')
  })
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
          const askForHighlight = (id) => {
            port.postMessage({
              from: 'side-panel',
              message: 'highlight',
              elementId: id,
            })
          }
          document.querySelectorAll('.highlight-button').forEach((el) => {
            el.addEventListener('click', (event) => {
              askForHighlight(event.target.getAttribute('data-treeid'))
            })
          })
          break
        case 'validation':
          message.content.forEach((item) => {
            const selector = `#${item.element} span.validation`
            document.querySelector(selector).innerHTML = item.message
          })
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

  // Buttons
  document.getElementById('generate-schema').addEventListener('click', () => {
    document.querySelector('main').classList.remove('disabled')
    port.postMessage({
      from: 'side-panel',
      message: 'generate-schema',
    })
  })

  document
    .getElementById('expand-schema')
    .addEventListener('click', function () {
      document
        .querySelectorAll('details')
        .forEach((details) => (details.open = true))
    })

  document
    .getElementById('collapse-schema')
    .addEventListener('click', function () {
      document
        .querySelectorAll('details')
        .forEach((details) => (details.open = false))
    })
})
