const schemaGenerator = {
  stringExtract: ({ str, len = 20, tag }) => {
    switch (tag) {
      case 'p':
        const sentenceEndings = /[.!?]/
        const paragraph = str.trim()

        const match = paragraph.match(sentenceEndings)

        return match ? paragraph.slice(0, match.index + 1).trim() : paragraph
        // str.length > len ? str.slice(0, 20) + '…' : str
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
  generateTreeHtml: (tree) => {
    const children = tree?.children || []
    const button = `<button type='button' title='Highlight in page' data-treeid='${tree.id}' class='highlight-button'>${tree.tag}</button>`

    let nodeText = `<div class='tag inline' data-tag='${tree.tag}'>${button} </div>`

    nodeText += '<div class="inline hidden">'

    if (tree.attributes.length != 0) {
      tree.attributes.forEach((attr) => {
        nodeText += ` <span class='attribute'>${attr[0]}: ${attr[1]}</span>`
      })
    }

    if (tree.elementText.length != 0) {
      nodeText += ` <span class='element-text'>${schemaGenerator.stringExtract({ str: tree.elementText, tag: tree.tag })}</span>`
    }

    if (tree.validation.length != 0) {
      tree.validation.forEach((item) => {
        nodeText += ` <span class='validation'>${item.message}</span>`
      })
    }

    nodeText += '</div>'

    // Insert children
    if (children.length > 0) {
      let childrenHtml = ''
      for (const child of children) {
        childrenHtml += schemaGenerator.generateTreeHtml(child)
      }
      nodeText += `<div class="children">${childrenHtml}</div>`
    }

    return `<div id='${tree.id}' class='node'>${nodeText}</div>`
  },

  generateSchemaHtml: (treeStructure) => {
    let htmlOutput = ''

    // Handle the case of multiple root elements
    for (const tree of treeStructure) {
      htmlOutput += schemaGenerator.generateTreeHtml(tree)
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
