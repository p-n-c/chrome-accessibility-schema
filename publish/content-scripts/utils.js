const utils = {
  htmlStringToDomElement: (htmlString) => {
    const container = document.createElement('div')
    container.innerHTML = htmlString.trim()
    return container
  },

  simpleUid: () => {
    const datePart = Date.now().toString(36)
    const randomPart = Math.random().toString(36).substring(2, 10)
    return (datePart + randomPart).substring(0, 16)
  },

  isWebPage: (url) => {
    return (
      url !== undefined && (url.startsWith('http:') || url.startsWith('https:'))
    )
  },
}

// Export `utils` for testing environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = utils
} else {
  window.utils = utils
}
