const $ = require('cheerio')
const fs = require('fs')
const path = require('path')
/* istanbul ignore next */
const get = require(process.env.USE_LAMBDA ? './http-request-lambda' : './http')

const {
  parseProductReviews,
  reviewFromHtml
} = require('./parsers/amazon')

module.exports = {
  getProductReviews,
  getProductReviewsCount,
  fetchSearchHtml,
  getProductDetailsHtml,
  getProductReviewsHtml
}

async function getProductReviews ({ asin, pageNumber = 1 } = {}, options) {
  const html = await getProductReviewsHtml({ asin, pageNumber }, options)
  fs.writeFileSync(path.resolve(__dirname, `html/${asin}-${pageNumber}.html`), html, { encoding: 'utf8' })
  const json = parseProductReviews(html).map(reviewFromHtml)
  fs.writeFileSync(path.resolve(__dirname, `json/${asin}-${pageNumber}.json`), JSON.stringify(json), { encoding: 'utf8' })
  return json
}
async function getProductReviewsCount ({ asin } = {}, options = {}) {
  const response = await get({ ...options, url: `https://www.amazon.it/dp/${asin}` })
  const { body } = response

  const doc = $(body)
  const text = doc.find('.averageStarRatingNumerical').text() || ''
  const num = text.match(/(\d+)/)
  return num ? +num[0] : 0
}
async function fetchSearchHtml ({ search } = {}, options = {}) {
  const response = await get({ ...options, url: `https://www.amazon.it/s?k=${encodeURIComponent(search)}` })
  return response.body
}
async function getProductDetailsHtml ({ asin } = {}, options = {}) {
  const response = await get({ ...options, url: `https://www.amazon.it/dp/${asin}` })
  return response.body
}
async function getProductReviewsHtml ({ asin, pageNumber = 1 }, options = {}) {
  const response = await get({ ...options, url: `https://www.amazon.it/product-reviews/${asin}?pageNumber=${pageNumber}` })
  return response.body
}
