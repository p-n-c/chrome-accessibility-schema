import { ruleHandlers } from '../../publish/content-scripts/validator-rule-handlers'
import { rulesConfig } from '../../publish/content-scripts/validator-rules-config'
import { HTMLValidator } from '../../publish/content-scripts/validator-core'

// Validator Tests
describe('HTMLValidator Element Tests', () => {
  let validator

  beforeEach(() => {
    document.body.innerHTML = ''
    global.chrome = { runtime: { id: 'test-id' } }
    validator = new HTMLValidator(rulesConfig, ruleHandlers)
  })

  test('should detect missing alt attribute on images', () => {
    document.body.innerHTML = '<img src="test.jpg">'
    const results = validator.validate()
    expect(results).toContainEqual(
      expect.objectContaining({
        message: 'Images must have alt text',
        type: 'error',
      })
    )
  })

  test('should pass when image has alt attribute', () => {
    document.body.innerHTML = '<img src="test.jpg" alt="test image">'
    const results = validator.validate()
    expect(results).not.toContainEqual(
      expect.objectContaining({
        message: 'Images must have alt text',
      })
    )
  })

  test('should detect missing href on links', () => {
    document.body.innerHTML = '<a>Click me</a>'
    const results = validator.validate()
    expect(results).toContainEqual(
      expect.objectContaining({
        message: 'Links must have href attribute',
        type: 'error',
      })
    )
  })

  test('should detect empty buttons', () => {
    document.body.innerHTML = '<button></button>'
    const results = validator.validate()
    expect(results).toContainEqual(
      expect.objectContaining({
        message: 'Buttons must have text content',
        type: 'error',
      })
    )
  })
})

describe('HTMLValidator Structure Tests', () => {
  let validator

  beforeEach(() => {
    document.body.innerHTML = ''
    global.chrome = { runtime: { id: 'test-id' } }
    validator = new HTMLValidator(rulesConfig, ruleHandlers)
  })

  test('should detect misplaced list items', () => {
    document.body.innerHTML = '<div><li>Item</li></div>'
    const results = validator.validate()
    expect(results).toContainEqual(
      expect.objectContaining({
        message: '<li> must be inside a <ul> or <ol> element',
        type: 'error',
      })
    )
  })

  test('should detect select elements without options', () => {
    document.body.innerHTML = '<select></select>'
    const results = validator.validate()
    expect(results).toContainEqual(
      expect.objectContaining({
        message: 'Select elements must contain options',
        type: 'error',
      })
    )
  })

  test('should detect misplaced table rows', () => {
    document.body.innerHTML = '<div><tr><td>Data</td></tr></div>'
    const results = validator.validate()
    expect(results).toContainEqual(
      expect.objectContaining({
        message: 'Table rows must be inside appropriate table sections',
        type: 'error',
      })
    )
  })
})

describe('HTMLValidator Accessibility Tests', () => {
  let validator

  beforeEach(() => {
    document.body.innerHTML = ''
    global.chrome = { runtime: { id: 'test-id' } }
    validator = new HTMLValidator(rulesConfig, ruleHandlers)
  })

  test('should detect invalid aria-labelledby reference', () => {
    document.body.innerHTML = '<div aria-labelledby="nonexistent">Content</div>'
    const results = validator.validate()
    expect(results).toContainEqual(
      expect.objectContaining({
        message: 'aria-labelledby must reference existing ID',
        type: 'error',
      })
    )
  })

  test('should detect inputs without labels', () => {
    document.body.innerHTML = '<input type="text">'
    const results = validator.validate()
    expect(results).toContainEqual(
      expect.objectContaining({
        message: 'Input elements must have associated labels',
        type: 'error',
      })
    )
  })

  test('should pass when input has aria-label', () => {
    document.body.innerHTML = '<input type="text" aria-label="Test input">'
    const results = validator.validate()
    expect(results).not.toContainEqual(
      expect.objectContaining({
        message: 'Input elements must have associated labels',
      })
    )
  })
})

describe('HTMLValidator Metadata Tests', () => {
  let validator

  beforeEach(() => {
    document.body.innerHTML = ''
    global.chrome = { runtime: { id: 'test-id' } }
    validator = new HTMLValidator(rulesConfig, ruleHandlers)
  })

  test('should detect missing document title', () => {
    const results = validator.validate()
    expect(results).toContainEqual(
      expect.objectContaining({
        message: 'Document must have a non-empty title',
        type: 'error',
      })
    )
  })

  test('should detect invalid language code', () => {
    document.documentElement.setAttribute('lang', 'invalid')
    const results = validator.validate()
    expect(results).toContainEqual(
      expect.objectContaining({
        message: 'Document must have a valid language code',
        type: 'error',
      })
    )
  })

  test('should detect missing meta description', () => {
    const results = validator.validate()
    expect(results).toContainEqual(
      expect.objectContaining({
        message: 'Meta description is required',
        type: 'error',
      })
    )
  })
})

// Rule Handlers Tests
describe('Input Rule Handler Tests', () => {
  test('should validate input with explicit label', () => {
    document.body.innerHTML = `
      <label for="test">Test Label</label>
      <input id="test" type="text">
    `
    const input = document.querySelector('input')
    expect(ruleHandlers.input.validAssociation(input)).toBe(true)
  })

  test('should validate input with aria-label', () => {
    document.body.innerHTML = '<input type="text" aria-label="Test Label">'
    const input = document.querySelector('input')
    expect(ruleHandlers.input.validAssociation(input)).toBe(true)
  })

  test('should validate input with aria-labelledby', () => {
    document.body.innerHTML = `
      <div id="label">Test Label</div>
      <input type="text" aria-labelledby="label">
    `
    const input = document.querySelector('input')
    expect(ruleHandlers.input.validAssociation(input)).toBe(true)
  })

  test('should fail validation with no label association', () => {
    document.body.innerHTML = '<input type="text">'
    const input = document.querySelector('input')
    expect(ruleHandlers.input.validAssociation(input)).toBe(false)
  })
})

describe('Select Rule Handler Tests', () => {
  test('should validate select with explicit label', () => {
    document.body.innerHTML = `
      <label for="test">Test Label</label>
      <select id="test"></select>
    `
    const select = document.querySelector('select')
    expect(ruleHandlers.select.validAssociation(select)).toBe(true)
  })

  test('should validate select with aria-label', () => {
    document.body.innerHTML = '<select aria-label="Test Label"></select>'
    const select = document.querySelector('select')
    expect(ruleHandlers.select.validAssociation(select)).toBe(true)
  })

  test('should fail validation with no label association', () => {
    document.body.innerHTML = '<select></select>'
    const select = document.querySelector('select')
    expect(ruleHandlers.select.validAssociation(select)).toBe(false)
  })
})

describe('Metadata Rule Handler Tests', () => {
  test('title validator should pass with non-empty title', () => {
    expect(ruleHandlers.title.validator('Test Title')).toBe(true)
  })

  test('title validator should fail with empty title', () => {
    expect(ruleHandlers.title.validator('')).toBe(false)
    expect(ruleHandlers.title.validator(' ')).toBe(false)
  })

  test('lang validator should pass with valid language codes', () => {
    expect(ruleHandlers.lang.validator('en')).toBe(true)
    expect(ruleHandlers.lang.validator('en-US')).toBe(true)
    expect(ruleHandlers.lang.validator('fra')).toBe(true)
  })

  test('lang validator should fail with invalid language codes', () => {
    expect(ruleHandlers.lang.validator('e')).toBe(false)
    expect(ruleHandlers.lang.validator('english')).toBe(false)
    expect(ruleHandlers.lang.validator('en-USA')).toBe(false)
  })

  test('description validator should enforce length constraints', () => {
    expect(ruleHandlers.description.validator('A'.repeat(30))).toBe(false) // Too short
    expect(ruleHandlers.description.validator('A'.repeat(180))).toBe(false) // Too long
    expect(ruleHandlers.description.validator('A'.repeat(100))).toBe(true) // Just right
  })

  test('description message formatter should provide appropriate messages', () => {
    const shortDesc = 'Short'
    const message = ruleHandlers.description.messageFormatter(shortDesc)
    expect(message).toBe(
      'Meta description must be between 50-160 characters (currently 5)'
    )
  })
})
