const log = require('debug')('mega-scraper:url-logics:amazon')
module.exports = {
  extractAsin,
  extractPage,
  nextPageUrlFromUrl,
  productReviewsUrl
}
function extractAsin (url = '') {
  let match = url.match(/\/dp\/(\w+)/)
  if (Array.isArray(match) && match.length >= 1) return match[1]
  match = url.match(/\/product-reviews\/(\w+)/)
  return Array.isArray(match) ? match[1] : null
}
function extractPage (url = '') {
  const match = url.match(/pageNumber=(\d+)/)
  return Array.isArray(match) ? parseInt(match[1]) : 1
}
function nextPageUrlFromUrl (url) {
  const domain = extractDomain(url)
  const nextPageNumber = extractPage(url) + 1
  const asin = extractAsin(url)
  return `https://${domain}/product-reviews/${asin}/?pageNumber=${nextPageNumber}`
}
function productReviewsUrl ({ url, asin, pageNumber }) {
  const domain = extractDomain(url)
  pageNumber = pageNumber || extractPage(url)
  asin = asin || extractAsin(url)
  return `https://${domain}/product-reviews/${asin}/?pageNumber=${pageNumber}`
}
function extractDomain (url) {
  const match = url.match(/amazon\.\w+/)
  if (match) return match[0]
  return null
}
