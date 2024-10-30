const schemaGenerator = {
  htmlStringToDomElement: (htmlString) => {
    const container = document.createElement('div')
    container.innerHTML = htmlString.trim()
    return container
  },
  generateTreeHtml: (tree) => {
    const children = tree?.children || []
    const button = `<button type='button' title='Highlight in page' data-treeid='${tree.id}' class='highlight-button'>←</button>`
    // Base case: if there are no children, return a div with just the tag name

    let nodeText = `<span class='tag'>${button} ${tree.tag}</span>`

    if (tree.attribute.length != 0) {
      nodeText += ` <span class='attribute hidden'>${tree.attribute}</span>`
    }

    if (tree.elementText.length != 0) {
      nodeText += ` <span class='element-text hidden'>${tree.elementText}</span>`
    }

    nodeText += ` <span class='validation hidden'>✓</span>`

    // Base case: if there are no children, return a span with just the tag name
    if (children?.length === 0) {
      return `<div id='${tree.id}'>${nodeText}</div>`
    }

    // Recursive case: create a details element with a summary and nested details
    let childrenHtml = ''
    for (const child of children) {
      childrenHtml += schemaGenerator.generateTreeHtml(child)
    }

    return `
      <details id='${tree.id}'>
          <summary>${nodeText}</summary>
          ${childrenHtml}
      </details>
    `
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
