const { simpleUid } =
  typeof module !== 'undefined' && module.exports
    ? require('./utils')
    : window.utils

const treeElements = [
  'a',
  'address',
  'area',
  'article',
  'aside',
  'audio',
  'blockquote',
  'body',
  'br',
  'button',
  'canvas',
  'caption',
  'cite',
  'col',
  'colgroup',
  'dd',
  'details',
  'dialog',
  'div',
  'dl',
  'dt',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'head',
  'header',
  'hgroup',
  'hr',
  'html',
  'iframe',
  'img',
  'input',
  'label',
  'legend',
  'li',
  'link',
  'main',
  'map',
  'menu',
  'meta',
  'nav',
  'ol',
  'option',
  'output',
  'p',
  'picture',
  'pre',
  'progress',
  'script',
  'search',
  'section',
  'select',
  'source',
  'span',
  'style',
  'summary',
  'table',
  'tbody',
  'td',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'title',
  'tr',
  'track',
  'ul',
  'video',
]

const treeElementsWithText = [
  'a',
  'button',
  'dd',
  'div',
  'dt',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'label',
  'li',
  'p',
  'span',
  'td',
  'textarea',
]

const landmarks = [
  'banner',
  'navigation',
  'main',
  'contentinfo',
  'complementary',
  'form',
  'search',
  'region',
]

const landmarkRoles = ['contentinfo', 'complementary', 'region']

const attributes = ['alt', 'id', 'class']

const isValidElement = (node) => {
  return node.nodeType === 1
}

const matchFirstAttribute = (attributes, matches) => {
  return attributes.find((attr) => matches.includes(attr))
}

const treeBuilder = {
  isValidNode: (node) => {
    return isValidElement(node)
      ? treeElements.includes(node.tagName.toLowerCase())
      : false
  },
  createNode: (element) => {
    const id = simpleUid()

    element.setAttribute(`data-${chrome.runtime.id}`, id)
    const node = {
      tag: element.tagName.toLowerCase(),
      id: id,
      attribute: '',
      elementText: '',
      children: [],
    }

    // Add text for selected attributes, and show attribute name
    const match = matchFirstAttribute(attributes, element.getAttributeNames())
    if (match) {
      node.attribute = `${match}: ${element.getAttribute(match)}`
    }

    // Add text for selected elements
    const includeText = treeElementsWithText.includes(
      element.nodeName.toLowerCase()
    )
    if (includeText) {
      node.elementText = `${element.textContent}`
    }

    // Return the node
    return node
  },
  buildHtmlTree: (element) => {
    if (element.tagName.toLowerCase() !== 'script') {
      const node = treeBuilder.createNode(element)

      // Recursively process each child element
      const children = element.children
      for (let child of children) {
        if (treeBuilder.isValidNode(child)) {
          // Only process elements (ignore text, comments, scripts, etc.)
          const childTree = treeBuilder.buildHtmlTree(child)
          if (childTree) node.children.push(childTree)
        }
      }
      return node
    }
  },
  htmlDocumentToTree: (nodeDocument) => {
    const _document = nodeDocument || document

    // Initialize an empty array to store the parsed elements
    const treeStructure = []

    // Get all elements in the document
    const rootElements = Array.from(_document.children)

    // Process each root element
    for (let element of rootElements) {
      const tree = treeBuilder.buildHtmlTree(element)
      if (tree) {
        treeStructure.push(tree)
      }
    }

    return treeStructure
  },
}

// Export `treeBuilder` for testing environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = treeBuilder
}
