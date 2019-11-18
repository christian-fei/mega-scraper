module.exports = function extractPage (url = '') {
  const match = url.match(/pageNumber=(\d+)/)
  return Array.isArray(match) ? parseInt(match[1]) : 1
}
