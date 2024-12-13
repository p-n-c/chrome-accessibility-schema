const highLightElement = (id) => {
  const dataAttribute = 'data-pac'

  const element = document.querySelector(`[${dataAttribute}="${id}"]`)
  if (!element) return

  element.scrollIntoView({ behavior: 'smooth', block: 'center' })

  // Get the exact dimensions and position of the element
  const rect = element.getBoundingClientRect()
  const padding = 10

  // Create a temporary element for the flash effect
  const overlayElement = document.createElement('div')
  overlayElement.id = id
  overlayElement.classList.add('pac-overlay')
  overlayElement.style.position = 'fixed'
  overlayElement.style.top = rect.top - padding + 'px'
  overlayElement.style.left = rect.left - padding + 'px'
  overlayElement.style.borderRadius = '5px'
  overlayElement.style.width = rect.width + padding * 2 + 'px'
  overlayElement.style.height = rect.height + padding * 2 + 'px'
  overlayElement.style.boxSizing = 'border-box'
  overlayElement.style.backgroundColor = '#E6200A'
  overlayElement.style.border = '1px solid black'
  overlayElement.style.opacity = '.3'
  overlayElement.style.filter = overlayElement + ' blur(0.5px)' // Limit aliasing with mixBlendMode
  overlayElement.style.pointerEvents = 'none'
  overlayElement.style.zIndex = 999

  // Add a non-breaking space to ensure the element is not considered "empty"
  overlayElement.innerHTML = '&nbsp;'

  // Add the highlight element to the body
  document.body.appendChild(overlayElement)

  // Function to update position on scroll
  const updatePosition = () => {
    const updatedRect = element.getBoundingClientRect()
    overlayElement.style.top = updatedRect.top - padding + 'px'
    overlayElement.style.left = updatedRect.left - padding + 'px'
  }

  // Add scroll event listener
  window.addEventListener('scroll', updatePosition)
  return overlayElement
}

let highLight = undefined

chrome.runtime.onMessage.addListener((message) => {
  if (message.from === 'service-worker') {
    switch (message.message) {
      case 'highlight':
        const idToHighlight = highLight?.id
        highLight?.remove()
        if (message.elementId !== idToHighlight) {
          highLight = highLightElement(message.elementId)
        } else {
          highLight = undefined
        }
        break
    }
  }
})
