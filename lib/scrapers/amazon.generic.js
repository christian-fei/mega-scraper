const log = require('debug')('mega-scraper:scrapers:amazon.generic')
const withQueue = require('./with-queue')
const { extractAsin, extractPage, nextPageUrlFromUrl } = require('../url-logics/amazon')
const { reviewsFromHtml } = require('../parsers/amazon')
const { saveFor } = require('../storage/scrape-cache')

module.exports = async function amazonGenericScraper ({ url, queue, events, browser, ...options }) {
  let page

  queue.add({ url })

  return withQueue({
    url,
    queue,
    events,
    browser,
    processFn: async (job, done) => {
      log('processing job', job.id)
      const { url } = job.data || {}

      let asin, pageNumber

      try {
        if (!url) throw new Error('missing url')

        asin = extractAsin(url)
        pageNumber = extractPage(url)
        log('scraping', { url, asin, pageNumber })
        let content = ''
        let title = ''
        page = page || await browser.newPage()
        await page.goto(url)
        content = await page.content()
        title = await page.title()
        if (content && /captcha/gi.test(content)) {
          log('found captcha', url)
          events.emit('captcha', new Error('captcha', content))
          throw new Error('captcha')
        }
        log('content', content && content.substring(0, 250))

        const reviews = reviewsFromHtml(content)
          .map(r => Object.assign(r, { asin, pageNumber, url, title: r.title || title }))
        log(`parsed ${reviews && reviews.length} reviews page ${asin} ${pageNumber}`)

        saveFor(url, { html: content, json: reviews })

        if (reviews.length === 0) {
          events.emit('done', { noReviewsFound: true })
          return done(null)
        }

        reviews.map(r => events.emit('review', r))

        const nextUrl = nextPageUrlFromUrl(url)
        const nextPageNumber = extractPage(nextUrl)
        log({ nextUrl, nextPageNumber })

        if (toPageReached(options.toPage, pageNumber)) {
          log(`toPage ${options.toPage}`)
          events.emit('done', { toPageReached: true, toPage: options.toPage })
          return done(null)
        }

        if (nextUrl !== url) await queue.add({ url: nextUrl }, { priority: 1 })
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
        // done(new Error(`job failed ${job.id} ${err.message}`))
      }
    }
  })
}

function toPageReached (toPage, pageNumber) {
  return Number.isFinite(toPage) && pageNumber >= toPage
}
