export const htmlStringToDomElement = function (htmlString) {
  const container = document.createElement('div')
  container.innerHTML = htmlString.trim()
  return container
}

export const simpleUid = function () {
  const datePart = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 10)
  return (datePart + randomPart).substring(0, 16)
}
