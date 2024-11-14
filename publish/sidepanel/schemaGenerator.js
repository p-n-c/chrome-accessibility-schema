const schemaGenerator = {
  stringExtract: (str, len = 20) =>
    str.length > len ? str.slice(0, 20) + '…' : str,

  htmlStringToDomElement: (htmlString) => {
    const container = document.createElement('div')
    container.innerHTML = htmlString.trim()
    return container
  },
  generateTreeHtml: (tree) => {
    const children = tree?.children || []
    const button = `<button type='button' title='Highlight in page' data-treeid='${tree.id}' class='highlight-button'>←</button>`

    let nodeText = `<span class='tag'>${button} ${tree.tag}</span>`

    if (tree.attribute.length != 0) {
      nodeText += ` <span class='attribute'>${tree.attribute}</span>`
    }

    if (tree.elementText.length != 0) {
      nodeText += ` <span class='element-text'>${schemaGenerator.stringExtract(tree.elementText)}</span>`
    }

    if (tree.validation.length != 0) {
      tree.validation.forEach((item) => {
        nodeText += ` <span class='validation'>${item.message}</span>`
      })
    }

    // Insert children
    if (children.length > 0) {
      let childrenHtml = ''
      for (const child of children) {
        childrenHtml += schemaGenerator.generateTreeHtml(child)
      }
      nodeText += `<div class="children">${childrenHtml}</div>`
    }

    return `<div id='${tree.id}'>${nodeText}</div>`
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
