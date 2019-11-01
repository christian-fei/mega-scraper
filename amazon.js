const $ = require('cheerio')
const log = require('debug')('scraper:amazon')
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
  const url = `https://www.amazon.it/product-reviews/${asin}`
  log('getProductReviewsCount url', url)
  const response = await get({ ...options, url })
  const { body } = response

  if (body.indexOf('Amazon CAPTCHA')) { return log('captcha!', asin) }

  const doc = $(body)
  const text = doc.find('[data-hook="cr-filter-info-review-count"]').text() || ''
  log('text', text)
  const num = text.split(' ').map(w => w.replace(',', '').replace('.', '')).map(n => parseInt(n, 10)).filter(Boolean)
  // const num = text.match(/([\d\\.,]+)/)
  log('num, text', num, text)
  if (!Array.isArray(num) || !num[0]) {
    // console.error('body', body)
    return
  }
  const number = num[num.length - 1]
  const count = parseInt(number.replace('.', '').replace(',', ''))
  log('count', count)
  return count
}
async function fetchSearchHtml ({ search } = {}, options = {}) {
  const url = `https://www.amazon.it/s?k=${encodeURIComponent(search)}`
  log('fetchSearchHtml url', url)
  const response = await get({ ...options, url })
  return response.body
}
async function getProductDetailsHtml ({ asin } = {}, options = {}) {
  const url = `https://www.amazon.it/dp/${asin}`
  log('getProductDetailsHtml url', url)
  const response = await get({ ...options, url })
  return response.body
}
async function getProductReviewsHtml ({ asin, pageNumber = 1 }, options = {}) {
  const url = `https://www.amazon.it/product-reviews/${asin}?pageNumber=${pageNumber}`
  log('getProductReviewsHtml url', url)
  const response = await get({ ...options, url })
  return response.body
}
