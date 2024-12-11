const schemaGenerator = {
  stringExtract: ({ str, len = 20, tag }) => {
    switch (tag) {
      case 'p':
        const sentenceEndings = /[.!?]/
        const paragraph = str.trim()

        const match = paragraph.match(sentenceEndings)

        return match ? paragraph.slice(0, match.index + 1).trim() : paragraph
        break
      default:
        return str
    }
  },

  htmlStringToDomElement: (htmlString) => {
    const container = document.createElement('div')
    container.innerHTML = htmlString.trim()
    return container
  },
  generateTreeHtml: (tree, depth) => {
    const children = tree?.children || []
    const button = `<button type='button' title='Highlight in page' data-treeid='${tree.id}' class='highlight-button'>${tree.tag}</button>`

    let nodeText = `<summary class='tag' data-tag='${tree.tag}'>${button} </summary>`

    nodeText += '<div class="inline">'

    if (tree.attributes.length != 0) {
      tree.attributes.forEach((attr) => {
        nodeText += ` <span class='attribute hidden'><strong>${attr[0]}</strong>: ${attr[1]}</span>`
      })
    }

    if (tree.elementText.length != 0) {
      nodeText += ` <span class='element-text hidden'><strong>text</strong>: ${schemaGenerator.stringExtract({ str: tree.elementText, tag: tree.tag })}</span>`
    }

    if (tree.validation.length != 0) {
      tree.validation.forEach((item) => {
        nodeText += ` <span class='validation hidden'><strong>validation</strong>: ${item.message}</span>`
      })
    }

    nodeText += '</div>'

    // Insert children
    if (children.length > 0) {
      depth++
      // console.log('depth ', depth)
      let childrenHtml = ''
      for (const child of children) {
        childrenHtml += schemaGenerator.generateTreeHtml(child, depth)
      }
      nodeText += `<div class="children">${childrenHtml}</div>`
    }

    return `<details open id='${tree.id}' class='node'>${nodeText}</details>`
  },

  generateSchemaHtml: (treeStructure) => {
    let htmlOutput = ''
    let depth = 0

    // Handle the case of multiple root elements
    for (const tree of treeStructure) {
      htmlOutput += schemaGenerator.generateTreeHtml(tree, depth)
    }

    return schemaGenerator.htmlStringToDomElement(htmlOutput)
  },
}

// Export `schemaGenerator` for node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = schemaGenerator
} else {
  window.generateSchemaHtml = schemaGenerator.generateSchemaHtml
}
