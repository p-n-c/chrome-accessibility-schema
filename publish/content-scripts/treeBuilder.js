// Handle both node.js and browser environments
const { simpleUid } =
  typeof module !== 'undefined' && module.exports ? require('./utils') : utils

// TODO Exclusion instead of inclusion for the tree elements
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
  'svg',
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

const attributesOfInterest = ['alt', 'id', 'class']

const isValidElement = (node) => {
  return node.nodeType === 1
}

const getElementAttributes = (element) => {
  let elementAttributes = []
  Array.from(element.attributes).forEach((attr) => {
    if (attributesOfInterest.includes(attr.name.toLowerCase())) {
      elementAttributes.push([attr.name, attr.value])
    }
  })
  return elementAttributes
}

const getElementText = (element) => {
  let textContent = ''
  // Add text for selected elements
  if (treeElementsWithText.includes(element.nodeName.toLowerCase())) {
    textContent = element.innerText || element.textContent
  }
  return textContent
}

const treeBuilder = {
  isValidElementNode: (node) => {
    return isValidElement(node)
      ? treeElements.includes(node.tagName.toLowerCase())
      : false
  },
  createElementNode: (element) => {
    const id = simpleUid()
    const attributes = getElementAttributes(element)
    const elementText = getElementText(element)
    element.setAttribute('data-pac', id)
    const node = {
      tag: element.tagName.toLowerCase(),
      id: id,
      attributes,
      elementText,
      validation: [],
      children: [],
    }

    // Return the node
    return node
  },
  buildHtmlTree: (element) => {
    if (element.tagName.toLowerCase() !== 'script') {
      const node = treeBuilder.createElementNode(element)

      // Recursively process each child element
      const children = element.children
      for (let child of children) {
        if (treeBuilder.isValidElementNode(child)) {
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
  findAllNodesWithTag: (rootNode, tagName, depth = 0) => {
    let matchingNodes = []
    // Check the rootNode
    if (rootNode?.tag === tagName) {
      matchingNodes.push({ node: rootNode, depth: depth })
    }
    try {
      for (let child of rootNode.children) {
        depth++
        matchingNodes.push(
          ...treeBuilder.findAllNodesWithTag(child, tagName, depth)
        )
      }
    } catch (error) {
      console.log(error)
    }
    return matchingNodes
  },
}

// Export `treeBuilder` for node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = treeBuilder
}
