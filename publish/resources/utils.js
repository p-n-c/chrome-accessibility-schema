export const htmlStringToDomElement = function (htmlString) {
  const container = document.createElement('div')
  container.innerHTML = htmlString.trim()
  return container
}

export const simpleUid = function () {
  const datePart = Date.now().toString(36) // Convert the current timestamp to base 36
  const randomPart = Math.random().toString(36).substring(2, 10) // Generate a random part and ensure it has a fixed length of 10 characters
  return (datePart + randomPart).substring(0, 16) // Combine and ensure the total length is always 16 characters
}
