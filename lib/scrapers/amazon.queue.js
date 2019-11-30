const log = require('debug')('mega-scraper:scrapers:amazon.queue')
const withQueue = require('./with-queue')
const { extractAsin, extractPage, nextPageUrlFromUrl } = require('../url-logics/amazon')
const { reviewsFromHtml } = require('../parsers/amazon')
const { productReviewsUrl } = require('../url-logics/amazon')
const { saveFor } = require('../storage/scrape-cache')
const takeScreenshot = require('../browser/take-screenshot')

module.exports = async function amazonQueueScraper ({ url, queue, events, browser, ...options }) {
  let page

  queue.add({ url })

  events.on('content', async ({ content, asin, pageNumber, url, title }) => {
    log('content', content && content.substring(0, 250))

    const reviews = reviewsFromHtml(content)
      .map(r => Object.assign(r, { asin, pageNumber, url, title: r.title || title }))
    log(`parsed ${reviews && reviews.length} reviews page ${asin} ${pageNumber}`)

    saveFor(url, { html: content, json: reviews })

    if (reviews.length === 0) {
      return events.emit('done', { noReviewsFound: true, asin, pageNumber, url })
    }

    reviews.map(r => events.emit('review', r))
  })

  return withQueue({
    url,
    queue,
    events,
    browser,
    processFn: async (job, done) => {
      log('processing job', job.id)
      let { url } = job.data || {}

      let asin, pageNumber

      try {
        if (!url) throw new Error('missing url')

        asin = extractAsin(url)
        pageNumber = extractPage(url)
        url = productReviewsUrl({ url })
        log('scraping', { url, asin, pageNumber })
        page = page || await browser.newPage()
        await page.goto(url)
        const content = await page.content()

        if (options.screenshot) {
          const screenshotPath = await takeScreenshot(page, { url })
          events.emit('screenshot', screenshotPath)
        }

        const title = await page.title()
        log('title', { url, asin, pageNumber, title })
        if (content && /captcha/gi.test(content)) {
          log('found captcha', url)
          events.emit('captcha', { url, content })
          done(new Error('captcha'))
        }

        events.emit('content', { content, asin, pageNumber, url, title })

        const nextUrl = nextPageUrlFromUrl(url)
        const nextPageNumber = extractPage(nextUrl)
        log({ nextUrl, nextPageNumber })

        if (toPageReached(options.toPage, pageNumber)) {
          log(`toPage ${options.toPage}`)
          events.emit('done', { toPageReached: true, toPage: options.toPage })
          return done(null)
        }

        if (nextUrl !== url && nextPageNumber > pageNumber) {
          events.emit('nextUrl', nextUrl)
        }

        done(null)
      } catch (err) {
        log(`job failed ${job.id} ${job.data}`, err.message)
        log('taking lock', job.id)
        await job.takeLock()
        log('moving to failed', job.id)
        await job.moveToFailed(new Error())
        log('retrying', job.id)
        await job.retry()
        events.emit('err', err)
        done(new Error(`job failed ${job.id} ${err.message}`))
      }
    }
  })
}

function toPageReached (toPage, pageNumber) {
  return Number.isFinite(toPage) && Number.isFinite(pageNumber) && pageNumber >= toPage
}
