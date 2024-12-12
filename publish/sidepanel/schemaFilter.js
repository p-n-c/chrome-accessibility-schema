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
        const rotor = document.querySelector('.rotor-rbs input:checked').id
        this.handleViewChange({ view, rotor })
      })
    })

    const rotors = document
      .getElementById('rotor-rbs')
      .querySelectorAll('input')

    rotors.forEach((rotor) => {
      rotor.addEventListener('change', () => {
        this.handleViewChange({
          view: 'rotor',
          rotor: rotor.id,
        })
      })
    })
  }

  handleViewChange({ view, rotor }) {
    // Reset all nodes to default state
    const nodes = Array.from(this.schemaContent.querySelectorAll('.node'))
    nodes.forEach((node) => (node.style.display = 'none'))

    // Set the body view class to match the selected tab view
    const body = document.querySelector('body')
    body.classList.remove(...body.classList)
    body.classList.add(`${view}-view`)

    switch (view) {
      case 'schema':
        this.hideValidation()
        nodes.forEach((node) => (node.style.display = 'block'))
        break
      case 'rotor':
        this.hideValidation()
        switch (rotor) {
          case 'landmarks':
            this.showRotorElements(LANDMARK_ELEMENTS)
            break
          case 'headers':
            this.showRotorElements(HEADER_ELEMENTS)
            break
        }
        break
      case 'validation':
        document
          .querySelectorAll('.validation.hidden')
          .forEach((e) => e.classList.remove('hidden'))
        this.showValidationElements(nodes)
        break
    }
    // Scroll to highlighted element
    document
      .querySelector('.tag.highlighter')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  hideValidation() {
    document.querySelectorAll('.validation').forEach((e) => {
      if (!e.classList.contains('hidden')) {
        e.classList.add('hidden')
        e.style.display = ''
      }
    })
  }

  showRotorElements(rotorList) {
    // Find all nodes with landmark elements
    const rotorNodes = this.schemaContent.querySelectorAll('.node')

    rotorNodes.forEach((node) => {
      const tagButton = node.querySelector('.highlight-button')
      if (tagButton) {
        const tag = tagButton?.textContent?.toLowerCase()
        if (rotorList.includes(tag)) {
          // Show this node and all its ancestor nodes
          this.showNodeAndParents(node)
        }
      }
    })
  }

  showValidationElements(nodes) {
    // Find all elements that have validation errors
    let validationNodes = Array.from(nodes).map((node) => {
      const validation = node.querySelector('.validation')
      if (validation) {
        return validation
      } else {
        node.style.display = 'none'
      }
    })

    validationNodes = validationNodes.filter((n) => n !== undefined)
    // Show all elements that have validation errors, and their parents
    validationNodes.forEach((node) => {
      this.showNodeAndParents(node)
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
