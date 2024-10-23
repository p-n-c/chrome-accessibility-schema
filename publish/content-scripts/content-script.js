;(async () => {
  const resources = chrome.runtime.getURL('resources/')
  const utils = await import(resources + 'utils.js')
})()

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'runExtension') {
    console.log('User clicked on the extension')

    // Add extension code here…
  }
})
