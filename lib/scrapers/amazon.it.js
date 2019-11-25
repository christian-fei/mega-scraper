const debug = require('debug')
const log = debug('mega-scraper:scrapers:amazon.it')
const takeScreenshot = require('../browser/take-screenshot')
const { extractAsin, extractPage } = require('../url-logics/amazon')
const { saveFor } = require('../storage/scrape-cache')
const { reviewsFromHtml } = require('../parsers/amazon')

module.exports = async function ({ url, page, ...options }) {
  log('scraping', url)
  const asin = extractAsin(url)
  const pageNumber = extractPage(url)

  await page.goto(url)

  const content = await page.content()

  if (options.screenshot) {
    const screenshotPath = await takeScreenshot(page, { url })
    log('screenshotPath', screenshotPath, url)
  }

  const title = await page.title()
  log('title', { url, title })
  if (content && /captcha/gi.test(content)) {
    log('found captcha', url)
    throw new Error('captcha')
  }
  const reviews = reviewsFromHtml(content)
    .map(r => Object.assign(r, { asin, pageNumber, url, title: r.title || title }))
  log(`parsed ${reviews && reviews.length} reviews page ${asin} ${pageNumber}`)

  saveFor(url, { html: content, json: reviews })

  return {
    data: { reviews }
  }
}
