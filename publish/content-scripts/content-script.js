const highLightElement = (id) => {
  const dataAttribute = `data-${chrome.runtime.id}`

  const element = document.querySelector(`[${dataAttribute}="${id}"]`)
  if (!element) return

  element.scrollIntoView({ behavior: 'smooth', block: 'center' })

  // Get the exact dimensions and position of the element
  const rect = element.getBoundingClientRect()
  const padding = 10

  // Create a temporary element for the flash effect
  const overlayElement = document.createElement('div')
  overlayElement.id = id
  overlayElement.style.position = 'fixed'
  overlayElement.style.top = rect.top - padding + 'px'
  overlayElement.style.left = rect.left - padding + 'px'
  overlayElement.style.width = rect.width + padding * 2 + 'px'
  overlayElement.style.height = rect.height + padding * 2 + 'px'
  overlayElement.style.boxSizing = 'border-box'
  overlayElement.style.backgroundColor = 'white'
  overlayElement.style.boxShadow = `inset 0 0 0 ${padding / 2}px black`
  overlayElement.style.border = '4px solid white'
  overlayElement.style.opacity = '0'
  overlayElement.style.pointerEvents = 'none'
  overlayElement.style.transition = 'opacity 0.3s ease'
  overlayElement.style.zIndex = '2147483647' // Maximum z-index value
  overlayElement.style.mixBlendMode = 'difference'
  overlayElement.style.opacity = '1'
  overlayElement.style.filter = overlayElement + ' blur(0.5px)' // Limit aliasing with mixBlendMode

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
