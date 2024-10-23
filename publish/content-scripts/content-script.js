;(async () => {
  const resources = chrome.runtime.getURL('resources/')
  const utils = await import(resources + 'utils.js')
  console.log(utils.simpleUid())
})()

console.log('Hello from content-script')

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'runExtension') {
    console.log('User clicked on the extension')

    // Add extension code here…
  }
})
