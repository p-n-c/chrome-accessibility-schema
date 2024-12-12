import './schemaGenerator.js'
import './schemaFilter.js'

function displaySchema(schemaHtml) {
  const schemaContainer = document.getElementById('schema-content')
  if (schemaHtml.length > 0) {
    schemaContainer.innerHTML = `${schemaHtml}`
  }

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

function calculateHTMLDepth(rootElement) {
  const parser = new DOMParser()
  const root = parser.parseFromString(rootElement, 'text/html').body

  let maxDepth = 0

  function traverse(element, currentNesting) {
    // If the current nesting values is higher than out current maximum, we update the maximum
    if (currentNesting > maxDepth) {
      maxDepth = currentNesting
    }

    // If there are children, we increment the current nesting count
    // Otherwise, we keep the same value and keep checking
    // When we reach a dead end, the current nesting value will be reset to 0
    for (let child of element.children) {
      const nesting = child?.classList?.contains('node')
        ? currentNesting + 1
        : currentNesting
      traverse(child, nesting)
    }
  }

  traverse(root, 0)
  return maxDepth
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
          window.close()
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
          // Display schema in the side panel
          displaySchema(schemaHtml.outerHTML)
          // Show the maximum nesting depth (schema tab)
          document.getElementById('max-depth').innerText = calculateHTMLDepth(
            schemaHtml.outerHTML
          )
          // Show the validation errors count (validation tab)
          document.getElementById('validation-errors-count').innerText =
            document.querySelectorAll('.validation').length
          // Highlight buttons
          const askForHighlight = (id) => {
            chrome.runtime.sendMessage({
              from: 'side-panel',
              message: 'highlight',
              elementId: id,
            })
          }
          // Open the schema
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
          // Select schema tab
          document.getElementById('schema-tab').click()
          break
        case 'reset-schema':
          break
      }
    }
  })

  // MDN Context menu
  // chrome.contextMenus.create(
  //   {
  //     id: 'mdn-consult',
  //     title: 'Search MDN for "%s"',
  //     contexts: ['selection'],
  //     documentUrlPatterns: [
  //       `chrome-extension://${chrome.runtime.id}/sidepanel/side-panel.html`,
  //     ],
  //   },
  //   () => {
  //     if (chrome.runtime.lastError) {
  //       // The menu item already exists, we can safely ignore this error
  //     }
  //   }
  // )

  const schemaFilter = new SchemaFilter()

  document.addEventListener('contextmenu', () => {
    let selection = document.getSelection()
    if (selection.anchorNode?.parentElement?.classList?.contains('tag')) {
      extendSelectionToWord(selection)
    }
  })
  // chrome.contextMenus.onClicked.addListener(function (info) {
  //   if (info.menuItemId === 'mdn-consult') {
  //     const selection = document.getSelection()
  //     const selectedText = selection.toString()
  //     openOrReloadWindow(
  //       `https://developer.mozilla.org/en-US/docs/Web/HTML/Element/${selectedText}`,
  //       'mdn-from-sidepanel'
  //     )
  //   }
  // })

  handleTabs()
})

const handleTabs = () => {
  const tabList = document.querySelector('[role="tablist"]')
  const tabs = tabList.querySelectorAll(':scope > [role="tab"]')

  // Add a click event handler to each tab
  tabs.forEach((tab) => {
    tab.addEventListener('click', changeTabs)
  })

  // Enable arrow navigation between tabs in the tab list
  let tabFocus = 0

  tabList.addEventListener('keydown', (e) => {
    // Move right
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      tabs[tabFocus].setAttribute('tabindex', -1)
      if (e.key === 'ArrowRight') {
        tabFocus++
        // If we're at the end, go to the start
        if (tabFocus >= tabs.length) {
          tabFocus = 0
        }
        // Move left
      } else if (e.key === 'ArrowLeft') {
        tabFocus--
        // If we're at the start, move to the end
        if (tabFocus < 0) {
          tabFocus = tabs.length - 1
        }
      }

      tabs[tabFocus].setAttribute('tabindex', 0)
      tabs[tabFocus].focus()
    }
  })
}

const changeTabs = (e) => {
  const targetTab = e.target
  const tabList = targetTab.parentNode
  const tabGroup = tabList.parentNode

  // Remove all current selected tabs
  tabList
    .querySelectorAll(':scope > [aria-selected="true"]')
    .forEach((t) => t.setAttribute('aria-selected', false))

  // Set this tab as selected
  targetTab.setAttribute('aria-selected', true)

  // Hide all tab panels
  tabGroup
    .querySelectorAll(':scope > [role="tabpanel"]')
    .forEach((p) => p.classList.add('hidden'))

  // Show the selected panel
  tabGroup
    .querySelector(`#${targetTab.getAttribute('aria-controls')}`)
    .classList.remove('hidden')
}
