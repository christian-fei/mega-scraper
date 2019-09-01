const httpRequestLambda = require('./http-request-lambda')
const $ = require('cheerio')

module.exports = {
  getProductReviews,
  fetchSearchHtml,
  fetchProductDetailsHtml,
  fetchProductReviewsHtml,
  parseProductReviews,
  extractReviewFromHtml
}

async function getProductReviews (search) {
  const html = await fetchProductReviewsHtml('B07VF7YVX4')
  return parseProductReviews(html).map(extractReviewFromHtml)
}

async function fetchSearchHtml (search) {
  const response = await httpRequestLambda({ url: `https://www.amazon.it/s?k=${encodeURIComponent(search)}` })
  console.log('response', response.substring(0, 200))
  return response
}
async function fetchProductDetailsHtml (asin) {
  const response = await httpRequestLambda({ url: `https://www.amazon.it/dp/${asin}` })
  console.log('response', response.substring(0, 200))
  return response
}
async function fetchProductReviewsHtml (asin, pageNumber = 1) {
  const response = await httpRequestLambda({ url: `https://www.amazon.it/product-reviews/${asin}?pageNumber=${pageNumber}` })
  console.log('response', response.substring(0, 200))
  return response
}
function parseProductReviews (html) {
  console.log('parseProductReviews', html.substring(0, 200))
  return Array.prototype.slice.call($('.review', html))
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
