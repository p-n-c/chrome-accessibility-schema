import './schemaGenerator.js'

let timeoutID = undefined

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

function closeMe() {
  window.close()
}

document.addEventListener('DOMContentLoaded', () => {
  // Listen for messages from the service worker
  chrome.runtime.onMessage.addListener((message) => {
    console.log(`Message received from ${message.from}: ${message.message}`)
    if (message.from === 'service-worker') {
      switch (message.message) {
        case 'close-side-panel':
          // Closing the side panel
          closeMe()
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

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      chrome.runtime.sendMessage({
        from: 'side-panel',
        message: 'closing',
      })
    }
  })
})

// Classic mode, for Dan
// prettier-ignore
window.activateClassicMode=(function(){const styles=`.cm-overlay{display:none;position:absolute;background:rgb(255 255 255 / 90%);z-index:1000;justify-content:center;text-align:center;padding:20px;}.cm-disabled{overflow:hidden;cursor:not-allowed;}.cm-disabled .cm-overlay{display:inline-block;inset:0;}`;const overlay=`<div class="cm-overlay">Connection with page lost.<br><br>Side panel closing soon</div>`;return function(){const styleSheet=document.createElement('style');styleSheet.id='classic-mode-styles';styleSheet.textContent=styles;document.head.appendChild(styleSheet);document.body.insertAdjacentHTML('afterbegin',overlay);console.log('%c⚠️ Classic Mode Activated ⚠️',`color:white;font-size:20px;padding:10px;font-weight:bold;background:#9932CC;animation:backgroundPulse 1s infinite;@keyframes backgroundPulse{50%{background:#7FFF00;}}`);setTimeout(()=>{document.querySelector('body').classList.add('cm-disabled');setTimeout(()=>window.close(),10000)},Math.random(5000)+5000)}})();
