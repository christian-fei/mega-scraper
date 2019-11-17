module.exports = function extractPage (url) {
  const match = url.match(/pageNumber=(\d+)/)
  return Array.isArray(match) ? match[1] : null
}
