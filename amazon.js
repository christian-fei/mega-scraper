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
  try {
    fs.writeFileSync(path.resolve(__dirname, `html/${asin}-${pageNumber}.html`), html, { encoding: 'utf8' })
  } catch (err) { console.error(err.message, err.stack) }

  const json = parseProductReviews(html).map(reviewFromHtml)
  try {
    fs.writeFileSync(path.resolve(__dirname, `json/${asin}-${pageNumber}.json`), JSON.stringify(json), { encoding: 'utf8' })
  } catch (err) { console.error(err.message, err.stack) }

  return json
}
async function getProductReviewsCount ({ asin } = {}, options = {}) {
  const url = `https://www.amazon.it/dp/${asin}`
  const response = await get({ ...options, url })
  const { body } = response

  const doc = $(body)
  const text = doc.find('.averageStarRatingNumerical').text() || ''
  const num = text.match(/([\d\\.]+)/)
  if (!Array.isArray(num) || !num[0]) {
    // console.error('body', body)
    return
  }
  return parseInt(num[0].replace('.', '').replace(',', ''))
}
async function fetchSearchHtml ({ search } = {}, options = {}) {
  const url = `https://www.amazon.it/s?k=${encodeURIComponent(search)}`
  const response = await get({ ...options, url })
  return response.body
}
async function getProductDetailsHtml ({ asin } = {}, options = {}) {
  const url = `https://www.amazon.it/dp/${asin}`
  const response = await get({ ...options, url })
  return response.body
}
async function getProductReviewsHtml ({ asin, pageNumber = 1 }, options = {}) {
  const url = `https://www.amazon.it/product-reviews/${asin}?pageNumber=${pageNumber}`
  console.log('url', url)
  const response = await get({ ...options, url })
  return response.body
}
