const $ = require('cheerio')
/* istanbul ignore next */
const get = require(process.env.USE_LAMBDA ? './http-request-lambda' : './http')

module.exports = {
  getProductReviews,
  fetchSearchHtml,
  fetchProductDetailsHtml,
  fetchProductReviewsHtml,
  parseProductReviews,
  extractReviewFromHtml
}

async function getProductReviews (asin, pageNumber = 1, options) {
  const html = await fetchProductReviewsHtml(asin, pageNumber, options)
  require('fs').writeFileSync(require('path').resolve(__dirname, `html/${asin}-${pageNumber}.html`), html, { encoding: 'utf8' })
  return parseProductReviews(html).map(extractReviewFromHtml)
}

async function fetchSearchHtml (search, options = {}) {
  const response = await get({ ...options, url: `https://www.amazon.it/s?k=${encodeURIComponent(search)}` })
  return response.body
}
async function fetchProductDetailsHtml (asin, options = {}) {
  const response = await get({ ...options, url: `https://www.amazon.it/dp/${asin}` })
  return response.body
}
async function fetchProductReviewsHtml (asin, pageNumber = 1, options = {}) {
  const response = await get({ ...options, url: `https://www.amazon.it/product-reviews/${asin}?pageNumber=${pageNumber}` })
  return response.body
}
function parseProductReviews (html) {
  const reviews = $('.review', html)
  const array = reviews.toArray()
  return array
}
function extractReviewFromHtml (html) {
  const starsContent = $('[data-hook="review-star-rating"]', html)
  const dateString = $('[data-hook="review-date"]', html).text()
  const text = $('[data-hook="review-body"]', html).text()
  let stars
  /* istanbul ignore next */
  if (!stars && starsContent.hasClass('a-star-5')) stars = 5
  /* istanbul ignore next */
  if (!stars && starsContent.hasClass('a-star-4')) stars = 4
  /* istanbul ignore next */
  if (!stars && starsContent.hasClass('a-star-3')) stars = 3
  /* istanbul ignore next */
  if (!stars && starsContent.hasClass('a-star-2')) stars = 2
  /* istanbul ignore next */
  if (!stars && starsContent.hasClass('a-star-1')) stars = 1

  return {
    stars,
    dateString,
    text
  }
}
