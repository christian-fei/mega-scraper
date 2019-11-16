module.exports = function extractAsin (url) {
  const match = url.match(/\/dp\/(\w+)/)
  return Array.isArray(match) ? match[1] : null
}
