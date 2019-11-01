const $ = require('cheerio')
const fs = require('fs')
const path = require('path')
/* istanbul ignore next */
const get = require(process.env.USE_LAMBDA ? './http-request-lambda' : './http')

module.exports = {
  getProductReviews,
  getProductReviewsCount,
  fetchSearchHtml,
  getProductDetailsHtml,
  getProductReviewsHtml,
  parseProductReviews,
  reviewFromHtml
}

async function getProductReviews ({ asin, pageNumber = 1 } = {}, options) {
  const html = await getProductReviewsHtml(asin, pageNumber, options)
  fs.writeFileSync(path.resolve(__dirname, `html/${asin}-${pageNumber}.html`), html, { encoding: 'utf8' })
  return parseProductReviews(html).map(reviewFromHtml)
}
async function getProductReviewsCount ({ asin } = {}, options = {}) {
  const response = await get({ ...options, url: `https://www.amazon.it/dp/${asin}` })
  const { body } = response

  const doc = $(body)
  const text = doc.find('.averageStarRatingNumerical').text() || ''
  const num = text.match(/(\d+)/)
  return num ? +num[0] : 0
}
async function fetchSearchHtml (search, options = {}) {
  const response = await get({ ...options, url: `https://www.amazon.it/s?k=${encodeURIComponent(search)}` })
  return response.body
}
async function getProductDetailsHtml ({ asin } = {}, options = {}) {
  const response = await get({ ...options, url: `https://www.amazon.it/dp/${asin}` })
  return response.body
}
async function getProductReviewsHtml (asin, pageNumber = 1, options = {}) {
  const response = await get({ ...options, url: `https://www.amazon.it/product-reviews/${asin}?pageNumber=${pageNumber}` })
  return response.body
}
function parseProductReviews (html) {
  const reviews = $('.review', html)
  const array = reviews.toArray()
  return array
}
function reviewFromHtml (html) {
  return {
    stars: starsFrom(html),
    dateString: dateFrom(html),
    text: textFrom(html)
  }
}
function dateFrom (html) {
  return $('[data-hook="review-date"]', html).text()
}
function textFrom (html) {
  return $('[data-hook="review-body"]', html).text()
}
function starsFrom (html) {
  const starsContent = $('[data-hook="review-star-rating"]', html)
  /* istanbul ignore next */
  if (starsContent.hasClass('a-star-5')) return 5
  /* istanbul ignore next */
  if (starsContent.hasClass('a-star-4')) return 4
  /* istanbul ignore next */
  if (starsContent.hasClass('a-star-3')) return 3
  /* istanbul ignore next */
  if (starsContent.hasClass('a-star-2')) return 2
  /* istanbul ignore next */
  if (starsContent.hasClass('a-star-1')) return 1
}
