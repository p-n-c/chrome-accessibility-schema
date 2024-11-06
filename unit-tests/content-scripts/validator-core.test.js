import { rulesConfig } from '../../publish/content-scripts/validator-rules-config'
import { HTMLValidator } from '../../publish/content-scripts/validator-core'

describe('HTMLValidator', () => {
  let validator
  let container
  // Mock chrome.runtime.id for the data attribute
  global.chrome = { runtime: { id: 'test-id' } }

  validator = new HTMLValidator(rulesConfig)
  container = document.createElement('div')
  document.body.appendChild(container)

  test('Images must have alt text for accessibility', () => {
    // Invalid case
    container.innerHTML = '<img src="test.jpg">'
    let results = validator.validate('element', 'attributePresence')
    expect(results.length).toBe(1)
    expect(results[0].message).toBe(
      'Elements that represent content must have alt text'
    )

    // Valid case
    container.innerHTML = '<img src="test.jpg" alt="Test image">'
    results = validator.validate('element', 'attributePresence')
    expect(results.length).toBe(0)
  })

  test('Links must have non-empty href attributes', () => {
    // Invalid cases
    container.innerHTML = `
      <a>Empty link</a>
      <a href="">Empty href</a>
      <a href="  ">Whitespace href</a>
    `
    let results = validator.validate('element', 'attributePresence')
    expect(results.length).toBe(3)
    results.forEach((result) => {
      expect(result.message).toBe('Links must have non-empty href attribute')
    })

    // Valid case
    container.innerHTML = '<a href="https://example.com">Valid link</a>'
    results = validator.validate('element', 'attributePresence')
    expect(results.length).toBe(0)
  })

  test('Interactive elements must have IDs for label association', () => {
    container.innerHTML = `
      <input type="text">
      <button>Click me</button>
      <select></select>
    `
    let results = validator.validate('element', 'attributePresence')
    expect(results.length).toBe(3)
    results.forEach((result) => {
      expect(result.message).toBe(
        'Interactive elements need an ID for label association'
      )
    })

    container.innerHTML = `
      <input type="text" id="input1">
      <button id="btn1">Click me</button>
      <select id="select1"></select>
    `
    results = validator.validate('element', 'attributePresence')
    expect(results.length).toBe(0)
  })

  test('Buttons and interactive elements must have text content', () => {
    container.innerHTML = `
      <button></button>
      <summary></summary>
      <figcaption></figcaption>
    `
    let results = validator.validate('element', 'contentPresence')
    expect(results.length).toBe(3)
    results.forEach((result) => {
      expect(result.message).toBe(
        'Interactive and descriptive elements must have text content'
      )
    })

    container.innerHTML = `
      <button>Click me</button>
      <summary>Details summary</summary>
      <figcaption>Figure caption</figcaption>
    `
    results = validator.validate('element', 'contentPresence')
    expect(results.length).toBe(0)
  })

  test('List items must be inside proper list containers', () => {
    container.innerHTML = '<li>Orphaned list item</li>'
    let results = validator.validate('structure', 'parentChild')
    expect(results.length).toBe(1)
    expect(results[0].message).toBe(
      '<li> must be inside a <ul>, <ol>, or <menu> element'
    )

    container.innerHTML = `
      <ul><li>Valid list item</li></ul>
      <ol><li>Numbered list item</li></ol>
      <menu><li>Menu list item</li></menu>
    `
    results = validator.validate('structure', 'parentChild')
    expect(results.length).toBe(0)
  })

  test('Table elements must maintain proper hierarchy', () => {
    // Create orphaned cell
    const orphanedCell = document.createElement('td')
    orphanedCell.textContent = 'Orphaned cell'
    container.appendChild(orphanedCell)

    // Create row without table
    const rowWithoutTable = document.createElement('tr')
    const cellInRow = document.createElement('td')
    cellInRow.textContent = 'Row without table'
    rowWithoutTable.appendChild(cellInRow)
    container.appendChild(rowWithoutTable)

    let results = validator.validate('structure', 'parentChild')

    // Check total number of errors
    expect(results.length).toBe(2)

    // Check if specific errors exist in results array, regardless of order
    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: '<td> must be inside a <tr> element',
        }),
        expect.objectContaining({
          message:
            '<tr> must be inside a <table>, <thead>, <tbody>, or <tfoot> element',
        }),
      ])
    )

    // Test valid structure
    container.innerHTML = '' // Clear container
    const table = document.createElement('table')
    const row = document.createElement('tr')
    const cell = document.createElement('td')
    cell.textContent = 'Valid cell'
    row.appendChild(cell)
    table.appendChild(row)
    container.appendChild(table)

    results = validator.validate('structure', 'parentChild')
    expect(results.length).toBe(0)
  })

  test('ARIA attributes must reference existing IDs', () => {
    container.innerHTML = `
      <button aria-labelledby="nonexistent">Invalid reference</button>
      <div aria-describedby="missing">Invalid description</div>
    `
    let results = validator.validate('accessibility', 'ariaReference')
    expect(results.length).toBe(2)
    expect(results[0].message).toContain('must reference existing ID')

    container.innerHTML = `
      <span id="label">Label</span>
      <button aria-labelledby="label">Valid reference</button>
    `
    results = validator.validate('accessibility', 'ariaReference')
    expect(results.length).toBe(0)
  })

  test('Document must have proper metadata', () => {
    document.title = ''
    const html = document.documentElement
    html.removeAttribute('lang')

    let results = validator.validate('metadata', 'documentProperties')
    expect(results.length).toBe(2)
    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: 'Document must have a non-empty title',
        }),
        expect.objectContaining({
          message: 'Document must have a valid language code',
        }),
      ])
    )

    document.title = 'Valid Title'
    html.setAttribute('lang', 'en-US')
    results = validator.validate('metadata', 'documentProperties')
    expect(results.length).toBe(0)
  })

  test('Viewport meta tag must be properly configured', () => {
    const head = document.head
    head.innerHTML = ''

    let results = validator.validate('metadata', 'metaTags')
    expect(results.length).toBe(3) // viewport, description, charset missing

    head.innerHTML = `
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta name="description" content="This is a properly sized meta description that provides good context for search engines and users alike">
      <meta charset="utf-8">
    `
    results = validator.validate('metadata', 'metaTags')
    expect(results.length).toBe(0)
  })
})
