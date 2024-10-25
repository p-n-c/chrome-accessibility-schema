const generateTreeHtml = (tree) => {
  const children = tree?.children || []
  const button = `<button type='button' title='Highlight in page' id='${tree.id}' class='highlight-button'>🖍</button>`
  // Base case: if there are no children, return a div with just the tag name

  let nodeText = `<span class='tag'>${button} ${tree.tag}</span>`

  if (tree.attribute.length != 0) {
    nodeText += ` <span class='attribute hidden'>${tree.attribute}</span>`
  }

  if (tree.elementText.length != 0) {
    nodeText += ` <span class='element-text hidden'>${tree.elementText}</span>`
  }

  // Base case: if there are no children, return a span with just the tag name
  if (children?.length === 0) {
    return `<div>${nodeText}</div>`
  }

  // Recursive case: create a details element with a summary and nested details
  let childrenHtml = ''
  for (const child of children) {
    childrenHtml += generateTreeHtml(child)
  }

  return `
    <details>
        <summary>${nodeText}</summary>
        ${childrenHtml}
    </details>
`
}

const generateSchemaHtml = (treeStructure) => {
  let htmlOutput = ''

  // Handle the case of multiple root elements
  for (const tree of treeStructure) {
    htmlOutput += generateTreeHtml(tree)
  }

  return htmlStringToDomElement(htmlOutput)
}
