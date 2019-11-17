module.exports = function extractAsin (url = '') {
  let match = url.match(/\/dp\/(\w+)/)
  if (Array.isArray(match) && match.length >= 1) return match[1]
  match = url.match(/\/product-reviews\/(\w+)/)
  return Array.isArray(match) ? match[1] : null
}
