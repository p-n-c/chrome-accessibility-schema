chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'runExtension') {
    console.log('User clicked on the extension')

    // Add extension code here…
  }
})
