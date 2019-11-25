const log = require('debug')('mega-scraper:scrapers:amazon.cluster')
const withCluster = require('./with-cluster')
const { nextPageUrl } = require('../parsers/amazon')
const { extractAsin, extractPage } = require('../url-logics/amazon')
const { reviewsFromHtml } = require('../parsers/amazon')
const { saveFor } = require('../storage/scrape-cache')
const getPuppeteerOptions = require('../browser/get-puppeteer-options')
const preparePage = require('../browser/prepare-page')

module.exports = async function amazonScraperCluster ({ url, queue, events, browser, ...options }) {
  const puppeteerOptions = getPuppeteerOptions(options)
  log('puppeteerOptions', puppeteerOptions)
  const { cluster } = await withCluster({
    url,
    puppeteerOptions,
    processFn: async ({ page, data }) => {
      const { url } = data || {}
      log('processing job', url)

      let asin, pageNumber

      try {
        if (!url) throw new Error('missing url')

        asin = extractAsin(url)
        pageNumber = extractPage(url)
        log('scraping', { url, asin, pageNumber })
        page = await preparePage(page, options)

        await page.goto(url)
        const content = await page.content()
        const title = await page.title()
        if (content && /captcha/gi.test(content)) {
          log('found captcha', url)
          events.emit('captcha', new Error('captcha', content))
          return cluster.queue({ url })
        }
        log('content', content && content.substring(0, 250))

        const reviews = reviewsFromHtml(content)
          .map(r => Object.assign(r, { asin, pageNumber, url, title: r.title || title }))
        log(`parsed ${reviews && reviews.length} reviews page ${asin} ${pageNumber}`)

        saveFor(url, { html: content, json: reviews })

        if (reviews.length === 0) return

        reviews.map(r => events.emit('review', r))

        const nextUrl = nextPageUrl(content)
        const nextPageNumber = extractPage(nextUrl)
        log({ nextUrl, nextPageNumber })

        if (toPageReached(options.toPage, pageNumber)) {
          log(`toPage ${options.toPage}`)
          return
        }

        if (nextUrl !== url) await cluster.queue({ url: nextUrl })
      } catch (err) {
        events.emit('err', err)
      }
    }
  })
}

function toPageReached (toPage, pageNumber) {
  return Number.isFinite(toPage) && pageNumber >= toPage
}
