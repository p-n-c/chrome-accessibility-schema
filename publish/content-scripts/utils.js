const utils = {
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

// Export `utils` for node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = utils
}
