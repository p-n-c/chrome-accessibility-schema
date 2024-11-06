import tb, {
  findAllNodesWithTag,
} from '../../publish/content-scripts/treeBuilder'

import fs from 'fs'
import path from 'path'

describe('Tree builder - isValidElementNode', () => {
  it('should return true for valid tree element nodes', () => {
    const validElement = document.createElement('div')
    expect(tb.isValidElementNode(validElement)).toBe(true)
  })

  it('should return false for non-tree element nodes', () => {
    const invalidElement = document.createElement('nonexistenttag')
    expect(tb.isValidElementNode(invalidElement)).toBe(false)
  })

  it('should return false for non-element nodes (text node)', () => {
    const textNode = document.createTextNode('Sample Text')
    expect(tb.isValidElementNode(textNode)).toBe(false)
  })

  it('should return false for a comment node', () => {
    const commentNode = document.createComment('This is a comment')
    expect(tb.isValidElementNode(commentNode)).toBe(false)
  })

  it('should ignore case of tag names', () => {
    const upperCaseTag = document.createElement('DIV')
    expect(tb.isValidElementNode(upperCaseTag)).toBe(true)
  })
})

describe('Tree builder - createElementNode', () => {
  it('should create a node with correct tag and id', () => {
    const element = document.createElement('div')
    const node = tb.createElementNode(element)

    expect(node.tag).toBe('div')
    expect(node.id).toBeDefined() // We only check if an ID exists.
    expect(element.getAttribute(`data-${chrome.runtime.id}`)).toBeDefined() // Checks if a data attribute is set.
  })

  it('should set the correct attribute if the element has one of the target attributes', () => {
    const element = document.createElement('div')
    element.id = 'test-id'
    const node = tb.createElementNode(element)

    expect(node.attribute).toBe('id: test-id')
  })

  it('should not set the attribute field if no target attributes are present', () => {
    const element = document.createElement('div')
    element.setAttribute('data-custom', 'customValue')
    const node = tb.createElementNode(element)

    expect(node.attribute).toBe('')
  })

  it('should add elementText for elements in treeElementsWithText', () => {
    const element = document.createElement('div')
    element.innerHTML = 'Sample Text'
    const node = tb.createElementNode(element)

    expect(node.elementText).toBe('Sample Text')
  })

  it('should not add elementText for elements not in treeElementsWithText', () => {
    const element = document.createElement('img')
    element.innerText = 'Ignored Text'
    const node = tb.createElementNode(element)

    expect(node.elementText).toBe('')
  })

  it('should return a node with an empty children array', () => {
    const element = document.createElement('div')
    const node = tb.createElementNode(element)

    expect(node.children).toEqual([])
  })
})

describe('Tree builder - buildHtmlTree', () => {
  it('should build a simple tree with no children', () => {
    const element = document.createElement('div')
    const tree = tb.buildHtmlTree(element)

    expect(tree.tag).toBe('div')
    expect(tree.children).toHaveLength(0) // No children, so children should not exist
  })

  it('should build a tree with one child', () => {
    const parent = document.createElement('div')
    parent.innerHTML = '<span>Inside the span</span>'

    const tree = tb.buildHtmlTree(parent)

    expect(tree.tag).toBe('div')
    expect(tree.children.length).toBe(1) // One child
    expect(tree.children[0].tag).toBe('span')
    expect(tree.children[0].children).toHaveLength(0) // No further children
  })

  it('should build a tree with multiple nested children', () => {
    const parent = document.createElement('div')
    parent.innerHTML = '<span>Inside span</span><p>Inside p</p>'

    const tree = tb.buildHtmlTree(parent)

    expect(tree.tag).toBe('div')
    expect(tree.children.length).toBe(2) // Two children
    expect(tree.children[0].tag).toBe('span')
    expect(tree.children[1].tag).toBe('p')
  })

  it('should not include invalid nodes in the tree', () => {
    const parent = document.createElement('div')
    parent.innerHTML =
      '<invalidElement>Inside invalid element</invalidElement><span>Inside span</span>'

    const tree = tb.buildHtmlTree(parent)

    expect(tree.tag).toBe('div')
    expect(tree.children.length).toBe(1) // Only one valid child
    expect(tree.children[0].tag).toBe('span')
  })

  it('should build a tree and ignore script elements', () => {
    const parent = document.createElement('div')
    parent.innerHTML =
      '<script>Beautiful script</script><span>Inside span</span>'

    const tree = tb.buildHtmlTree(parent)

    expect(tree.tag).toBe('div')
    expect(tree.children.length).toBe(1) // Script is ignored
    expect(tree.children[0].tag).toBe('span')
  })

  it('should handle deeply nested elements', () => {
    const parent = document.createElement('div')
    parent.innerHTML =
      '<p>Some text in p <span>And some text <a href="mylink">and a link</a>in span</span></p>'

    const tree = tb.buildHtmlTree(parent)

    expect(tree.tag).toBe('div')
    expect(tree.children.length).toBe(1)
    expect(tree.children[0].tag).toBe('p')
    expect(tree.children[0].children.length).toBe(1)
    expect(tree.children[0].children[0].tag).toBe('span')
    expect(tree.children[0].children[0].children.length).toBe(1)
    expect(tree.children[0].children[0].children[0].tag).toBe('a')
  })
})

describe('Tree builder - findAllNodesWithTag', () => {
  it('should find an element and its depth', () => {
    const parent = document.createElement('div')
    parent.innerHTML =
      '<p>Some text in p <span>And some text <a href="mylink">and a link</a>in span</span></p>'
    const tree = tb.buildHtmlTree(parent)
    const as = findAllNodesWithTag(tree, 'a')
    expect(as.length).toBe(1)
    expect(as[0].depth).toBe(3)
  })
})

describe('htmlDocumentToTree', () => {
  // Load the welcome.html file before running the tests
  const filePath = path.join(
    path.resolve(),
    'unit-tests',
    'content-scripts',
    'welcome.html'
  )
  const htmlContent = fs.readFileSync(filePath, 'utf-8')

  const parser = new DOMParser()
  const nodeDocument = parser.parseFromString(htmlContent, 'text/html')
  const result = tb.htmlDocumentToTree(nodeDocument)

  it('should parse the document and return a valid tree structure', () => {
    // Check that the root of the tree is the html tag
    expect(result.length).toBe(1)
    expect(result[0].tag).toBe('html')

    // Check that it has body and head as children
    const body = result[0].children.find((child) => child.tag === 'body')
    expect(body).toBeDefined()

    // Ensure that the tree contains the correct header content
    const header = body.children.find((child) => child.tag === 'header')
    expect(header).toBeDefined()
    const h1 = header.children.find((child) => child.tag === 'h1')
    expect(h1.elementText).toBe('Welcome')
  })

  it('should include links and their text content', () => {
    const body = result[0].children.find((child) => child.tag === 'body')

    const main = body.children.find((child) => child.tag === 'main')
    expect(main).toBeDefined()

    const links = tb.findAllNodesWithTag(main, 'a')
    expect(links.length).toBe(8)

    // Check link text
    const firstLink = links.find((link) =>
      link.node.elementText.includes('EU Accessibility Act')
    )
    expect(firstLink).toBeDefined()
  })

  it('should correctly handle images and their alt text', () => {
    const body = result[0].children.find((child) => child.tag === 'body')

    const figures = tb.findAllNodesWithTag(body, 'figure')
    expect(figures).toBeDefined()

    const images = tb.findAllNodesWithTag(figures[0].node, 'img')
    expect(images.length).toBe(2)

    // Check the alt text of the images
    const firstImage = images[0].node
    expect(firstImage.attribute).toContain('alt: Co-founder JP')
  })

  it('should ignore script elements', () => {
    // Ensure there are no script elements in the final tree
    const scripts = tb.findAllNodesWithTag(result[0], 'script')
    expect(scripts).toHaveLength(0)
  })

  it('should correctly build a tree with deeply nested elements', () => {
    const bodys = tb.findAllNodesWithTag(result[0], 'body')
    expect(bodys).toHaveLength(1)

    const mains = tb.findAllNodesWithTag(bodys[0].node, 'main')
    expect(mains).toHaveLength(1)

    const dls = tb.findAllNodesWithTag(mains[0].node, 'dl')
    expect(dls).toBeDefined()

    const dts = tb.findAllNodesWithTag(dls[0].node, 'dt')
    expect(dts.some((dt) => dt.node.elementText === 'Performance')).toBe(true)
  })
})
