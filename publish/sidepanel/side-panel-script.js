import './schemaGenerator.js'
import './schemaFilter.js'

function displaySchema(schemaHtml) {
  const schemaPlaceholder = document.getElementById('schema-placeholder')
  const schemaContainer = document.getElementById('schema-content')

  schemaPlaceholder.classList.toggle('hidden')
  schemaContainer.classList.toggle('hidden')
  schemaContainer.innerHTML = `${schemaHtml}`

  document
    .querySelector('[data-view="schema"]')
    .setAttribute('aria-selected', true)
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

function mergeValidationResults(tree, validationResults) {
  // Create a map for O(1) lookup of validation results
  const validationMap = new Map()

  validationResults.forEach((result) => {
    const item = {
      message: result.message,
      type: result.type,
      details: result.details,
    }
    if (validationMap.has(result.elementId)) {
      validationMap.get(result.elementId).push(item)
    } else {
      validationMap.set(result.elementId, [item])
    }
  })

  // Recursive function to traverse and update the tree in place
  function updateNode(node) {
    // Add validation if it exists
    const validation = validationMap.get(node.id)
    if (validation) {
      node.validation = validation // Replace the empty array
    }

    // Recursively process children if they exist
    if (node.children) {
      node.children.forEach(updateNode)
    }
  }

  // Recurse for each tree element
  tree.forEach(updateNode)
  return tree
}

document.addEventListener('DOMContentLoaded', () => {
  // Contains the processed tree with validation messages - Global for easy query in console
  window.tree = undefined

  // Signal opening to service-worker to trigger analysis of current page
  chrome.runtime.sendMessage({
    from: 'side-panel',
    message: 'loaded',
  })
  // Listen for messages from the service worker
  chrome.runtime.onMessage.addListener((message) => {
    console.log(`Message received from ${message.from}: ${message.message}`)
    // Message handling
    if (message.from === 'service-worker') {
      switch (message.message) {
        case 'close-side-panel':
          // Closing the side panel
          closeMe()
          break
        case 'title':
          document.getElementById('page-title').innerHTML = message.content
          break
        case 'tree':
          window.tree = message.content
          // Wait for validation to display the schema
          break
        case 'validation':
          // Merge the validation elements into the tree data structure
          const validationResults = message.content
          mergeValidationResults(window.tree, validationResults)
          // Inject the tree into the sidepanel
          const schemaHtml = window.generateSchemaHtml(window.tree)
          displaySchema(schemaHtml.outerHTML)
          // Highlight buttons
          const askForHighlight = (id) => {
            chrome.runtime.sendMessage({
              from: 'side-panel',
              message: 'highlight',
              elementId: id,
            })
          }
          document.querySelectorAll('.highlight-button').forEach((el) => {
            el.addEventListener('click', (event) => {
              const tag = event.target.parentElement
              if (tag.classList.contains('highlighter')) {
                tag.classList.remove('highlighter')
              } else {
                document
                  .querySelector('.highlighter')
                  ?.classList.remove('highlighter')
                tag.classList.add('highlighter')
              }
              askForHighlight(event.target.getAttribute('data-treeid'))
            })
          })
          break
        case 'reset-schema':
          schemaPlaceholder.classList.toggle('hidden')
          schemaContainer.classList.toggle('hidden')
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

  const schemaFilter = new SchemaFilter()

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
})

// Classic mode, for Dan
// prettier-ignore
window.activateClassicMode=(function(){const styles=`.cm-overlay{display:none;position:absolute;background:rgb(255 255 255 / 90%);z-index:1000;justify-content:center;text-align:center;padding:20px;}.cm-disabled{overflow:hidden;cursor:not-allowed;}.cm-disabled .cm-overlay{display:inline-block;inset:0;}`;const overlay=`<div class="cm-overlay">Connection with page lost.<br><br>Side panel closing soon</div>`;return function(){const styleSheet=document.createElement('style');styleSheet.id='classic-mode-styles';styleSheet.textContent=styles;document.head.appendChild(styleSheet);document.body.insertAdjacentHTML('afterbegin',overlay);console.log('%c⚠️ Classic Mode Activated ⚠️',`color:white;font-size:20px;padding:10px;font-weight:bold;background:#9932CC;animation:backgroundPulse 1s infinite;@keyframes backgroundPulse{50%{background:#7FFF00;}}`);setTimeout(()=>{document.querySelector('body').classList.add('cm-disabled');setTimeout(()=>window.close(),10000)},Math.random(5000)+5000)}})();
