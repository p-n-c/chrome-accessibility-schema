import {
  htmlStringToDomElement,
  simpleUid,
} from '../../publish/resources/utils'

describe('utils tests', () => {
  test('htmlStringToDomElement should convert HTML string to a DOM element', () => {
    const htmlString = '<div class="test-class">Hello, World!</div>'
    const domElement = htmlStringToDomElement(htmlString)

    // Check that the returned element is a 'div'
    expect(domElement.firstChild.tagName).toBe('DIV')

    // Check that the 'div' has the correct class
    expect(domElement.firstChild.classList.contains('test-class')).toBe(true)

    // Check that the 'div' contains the correct text content
    expect(domElement.firstChild.textContent).toBe('Hello, World!')
  })

  test('simpleUid should return a string of length 16', () => {
    expect(simpleUid()).toHaveLength(16)
  })
})
