const LANDMARK_ELEMENTS = [
  'banner',
  'complementary',
  'contentinfo',
  'form',
  'main',
  'navigation',
  'region',
  'search',
  'section',
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
    switch (view) {
      case 'schema':
        // Show everything for full schema
        allNodes.forEach((node) => (node.style.display = 'block'))
        break
      case 'landmarks':
        this.showElements(LANDMARK_ELEMENTS)
        break
      case 'headers':
        this.showElements(HEADER_ELEMENTS)
        break
    }
  }

  showElements(elementList) {
    // Find all nodes with landmark elements
    const landmarkNodes = this.schemaContent.querySelectorAll('.node')

    landmarkNodes.forEach((node) => {
      const tagButton = node.querySelector('.highlight-button')
      console.log(tagButton)
      if (tagButton) {
        const tag = tagButton.getAttribute('data-tag').toLowerCase()
        if (elementList.includes(tag)) {
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
