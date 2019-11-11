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

function get (options = { useProxy: true, puppeteer: false, lambda: false }) {
  log(options)
  if (options.puppeteer) return puppeteer(options)
  if (options.lambda) return lambda(options)
  return http(options)
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
    .filter(Boolean)
    .map(r => Object.assign(r, { screenshotPath }))
    .filter(r => r.text)
    .filter(r => r.stars)
    .filter(r => r.dateString)
  try {
    fs.mkdirSync(path.resolve(__dirname, `json/${asin}`))
  } catch (err) { }
  try {
    fs.writeFileSync(path.resolve(__dirname, `json/${asin}/${asin}-${pageNumber}.json`), JSON.stringify(json), { encoding: 'utf8' })
  } catch (err) { console.error(err.message, err.stack) }

  return { reviews: json, screenshotPath }
}
async function getProductReviewsCount ({ asin } = {}, options = {}) {
  const url = `https://www.amazon.it/product-reviews/${asin}`
  log('getProductReviewsCount url', url)
  const response = await get({ ...options, asin, url })
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
    log('unable to read productReviewsCount', text)
    return
  }
  const number = num[num.length - 1]
  const count = parseInt(number)
  log('productReviewsCount', count)
  return count
}
async function fetchSearchHtml ({ search } = {}, options = {}) {
  const url = `https://www.amazon.it/s?k=${encodeURIComponent(search)}`
  log('fetchSearchHtml url', url)
  const response = await get({ ...options, search, url })
  return response.body
}
async function getProductDetailsHtml ({ asin } = {}, options = {}) {
  const url = `https://www.amazon.it/dp/${asin}`
  log('getProductDetailsHtml url', url)
  const response = await get({ ...options, asin, url })
  return response.body
}
async function productReviews ({ asin, pageNumber = 1 }, options = {}) {
  const url = `https://www.amazon.it/product-reviews/${asin}?pageNumber=${pageNumber}`
  log('productReviews url', url)
  return get({ ...options, asin, url })
}
