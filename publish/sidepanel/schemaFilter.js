const LANDMARK_ELEMENTS = [
  'header', // Represents introductory content, typically a group of navigational or introductory elements
  'nav', // Contains navigation links for the current document or other pages
  'main', // Represents the dominant content of the body of a document
  'article', // Represents a self-contained composition in a document, page, application, or site
  'section', // Represents a standalone section of content
  'aside', // Contains content that is tangentially related to the content around it
  'footer', // Represents a footer for its nearest sectioning content or sectioning root element
]

const HEADER_ELEMENTS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']

class SchemaFilter {
  constructor(schemaContentId = 'schema-content') {
    this.schemaContent = document.getElementById(schemaContentId)
    this.setupEventListeners()
  }

  setupEventListeners() {
    // Find all tab buttons
    const tabs = document.querySelectorAll('[role="tab"]')

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        // Reset all tabs
        tabs.forEach((t) => t.setAttribute('aria-selected', 'false'))
        tab.setAttribute('aria-selected', 'true')

        const view = tab.dataset.view
        this.handleViewChange(view)
      })
    })
  }

  handleViewChange(view) {
    // Reset all nodes to default state
    const allNodes = this.schemaContent.querySelectorAll('.node')
    allNodes.forEach((node) => (node.style.display = 'none'))

    const body = document.querySelector('body')
    body.classList.remove(...body.classList)
    body.classList.add(view)

    switch (view) {
      case 'schema':
        allNodes.forEach((node) => (node.style.display = 'block'))
        break
      case 'rotor':
        this.showElements(LANDMARK_ELEMENTS)
        break
      case 'validation':
        allNodes.forEach((node) => (node.style.display = 'block'))
        break
    }
  }

  showElements(elementList) {
    // Find all nodes with landmark elements
    const landmarkNodes = this.schemaContent.querySelectorAll('.node')

    landmarkNodes.forEach((node) => {
      const tagButton = node.querySelector('.highlight-button')
      if (tagButton) {
        const tag = tagButton?.textContent?.toLowerCase()
        if (elementList.includes(tag)) {
          console.log(tag)
          // Show this node and all its ancestor nodes
          this.showNodeAndParents(node)
        }
      }
    })
  }

  showNodeAndParents(node) {
    // Show the current node
    node.style.display = 'block'

    // Recursively show all parent nodes up to the root
    let parent = node.parentElement
    while (parent) {
      if (parent.classList.contains('node')) {
        parent.style.display = 'block'
      }
      parent = parent.parentElement
    }
  }
}

// Export `SchemaFilter` for node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SchemaFilter
} else {
  window.SchemaFilter = SchemaFilter
}
