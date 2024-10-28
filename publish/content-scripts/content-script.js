// Handle both node.js and browser environments
// Needed for script injection
const { htmlDocumentToTree } =
  typeof module !== 'undefined' && module.exports
    ? require('./treeBuilder')
    : treeBuilder
