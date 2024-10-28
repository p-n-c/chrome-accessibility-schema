// Handle both node.js and browser environments
// Needed for script injection
const { htmlDocumentToTree } =
  typeof module !== 'undefined' && module.exports
    ? require('./treeBuilder')
    : treeBuilder

const highLightElement = (id) => {
  const dataAttribute = `data-${chrome.runtime.id}`

  const element = document.querySelector(`[${dataAttribute}="${id}"]`)
  if (!element) return

  element.scrollIntoView({ behavior: 'smooth', block: 'center' })

  // Get the exact dimensions and position of the element
  const rect = element.getBoundingClientRect()
  const padding = 10

  // Create a temporary element for the flash effect
  const highlightElement = document.createElement('div')
  highlightElement.style.position = 'fixed'
  highlightElement.style.top = rect.top - padding + 'px'
  highlightElement.style.left = rect.left - padding + 'px'
  highlightElement.style.width = rect.width + padding * 2 + 'px'
  highlightElement.style.height = rect.height + padding * 2 + 'px'
  highlightElement.style.boxSizing = 'border-box'
  highlightElement.style.backgroundColor = 'white'
  highlightElement.style.boxShadow = `inset 0 0 0 ${padding / 2}px black`
  highlightElement.style.border = '4px solid white'
  highlightElement.style.opacity = '0'
  highlightElement.style.pointerEvents = 'none'
  highlightElement.style.transition = 'opacity 0.3s ease'
  highlightElement.style.zIndex = '2147483647' // Maximum z-index value
  highlightElement.style.mixBlendMode = 'difference'

  // Add a non-breaking space to ensure the element is not considered "empty"
  highlightElement.innerHTML = '&nbsp;'

  // Add the flash element to the body
  document.body.appendChild(highlightElement)

  // Function to update position on scroll
  const updatePosition = () => {
    const updatedRect = element.getBoundingClientRect()
    highlightElement.style.top = updatedRect.top - padding + 'px'
    highlightElement.style.left = updatedRect.left - padding + 'px'
  }

  // Add scroll event listener
  window.addEventListener('scroll', updatePosition)

  // Trigger the flash effect
  requestAnimationFrame(() => {
    highlightElement.style.opacity = '1'
    const elementFilter = element.style.filter
    element.style.filter = elementFilter + ' blur(0.5px)' // Limit aliasing with mixBlendMode

    setTimeout(() => {
      highlightElement.style.opacity = '0'
      element.style.filter = elementFilter
      // Remove the flash element and event listener after the animation
      setTimeout(() => {
        document.body.removeChild(highlightElement)
        window.removeEventListener('scroll', updatePosition)
      }, 300) // Wait for fade-out transition
    }, 1000) // Flash duration
  })
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.from === 'service-worker') {
    switch (message.message) {
      case 'highlight':
        highLightElement(message.elementId)
        break
    }
  }
})
