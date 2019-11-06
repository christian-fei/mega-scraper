const $ = require('cheerio')
const log = require('debug')('sar:scraper:amazon')
const fs = require('fs')
const path = require('path')

/* istanbul ignore next */
const puppeteer = require('./puppeteer')
const http = require('./http')
const lambda = require('./http-request-lambda')

const {
  parseProductReviews,
  reviewFromHtml
} = require('./parsers/amazon')

module.exports = {
  scrapeProductReviews,
  getProductReviewsCount,
  fetchSearchHtml,
  getProductDetailsHtml,
  productReviews
}

function get (options = {}) {
  log(options)
  if (options.puppeteer) return puppeteer(options, { useProxy: options.useProxy })
  if (options.lambda) return lambda(options, { useProxy: options.useProxy })
  return http(options, { useProxy: options.useProxy })
}

async function scrapeProductReviews ({ asin, pageNumber = 1 } = {}, options) {
  const { body: html, screenshotPath } = await productReviews({ asin, pageNumber }, options)
  log({ screenshotPath })
  try {
    fs.mkdirSync(path.resolve(__dirname, `html/${asin}`))
  } catch (err) { }
  try {
    fs.writeFileSync(path.resolve(__dirname, `html/${asin}/${asin}-${pageNumber}.html`), html, { encoding: 'utf8' })
  } catch (err) { console.error(err.message, err.stack) }

  const json = parseProductReviews(html)
    .map(reviewFromHtml)
    .filter(r => r.text)
    .filter(r => r.stars)
    .filter(r => r.dateString)
  try {
    fs.mkdirSync(path.resolve(__dirname, `json/${asin}`))
  } catch (err) { }
  try {
    fs.writeFileSync(path.resolve(__dirname, `json/${asin}/${asin}-${pageNumber}.json`), JSON.stringify(json), { encoding: 'utf8' })
  } catch (err) { console.error(err.message, err.stack) }

  return json
}
async function getProductReviewsCount ({ asin } = {}, options = {}) {
  const url = `https://www.amazon.it/product-reviews/${asin}`
  log('getProductReviewsCount url', url)
  const response = await get({ ...options, url })
  const { body = '' } = response

  if (body.indexOf('Amazon CAPTCHA') >= 0) {
    log('captcha!', asin, body.substring(body.indexOf('Amazon CAPTCHA') - 20, body.indexOf('Amazon CAPTCHA') + 20))
    throw new Error('captcha')
  }

  const doc = $(body)
  const text = doc.find('[data-hook="cr-filter-info-review-count"]').text() || ''
  const num = text.split(' ').filter(Boolean).map(w => '' + w).map(w => w.replace(',', '').replace('.', '')).map(n => parseInt(n, 10)).filter(Boolean)
  if (!Array.isArray(num) || !num[0]) {
    // console.error('body', body)
    return
  }
  const number = num[num.length - 1]
  const count = parseInt(number)
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
async function productReviews ({ asin, pageNumber = 1 }, options = {}) {
  const url = `https://www.amazon.it/product-reviews/${asin}?pageNumber=${pageNumber}`
  log('productReviews url', url)
  return get({ ...options, url })
}
