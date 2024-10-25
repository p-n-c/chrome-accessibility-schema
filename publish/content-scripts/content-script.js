document.addEventListener('DOMContentLoaded', () => {
  console.log('Content loaded')
  chrome.runtime.sendMessage({
    from: 'content-script',
    message: 'content-loaded',
  })
})
