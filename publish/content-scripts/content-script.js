// Handle both node.js and browser environments
const { htmlDocumentToTree } =
  typeof module !== 'undefined' && module.exports
    ? require('./treeBuilder')
    : treeBuilder

document.addEventListener('DOMContentLoaded', () => {
  console.log('Content loaded')
  chrome.runtime.sendMessage({
    from: 'content-script',
    message: 'content-loaded',
  })
})
