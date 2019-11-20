const log = require('debug')('mega-scraper:scrapers:amazon.generic')
const withQueue = require('./with-queue')
const { nextPageUrl } = require('../parsers/amazon')
const extractAsin = require('../extract-asin')
const extractPage = require('../extract-page')
const { reviewsFromHtml } = require('../parsers/amazon')
const { htmlPathFor, jsonPathFor, saveFor, readFor } = require('../storage/scrape-cache')

module.exports = async function amazonGenericScraper ({ url, queue, events, browser, ...options }) {
  let page

  queue.add({ url })

  return withQueue({
    ...options,
    queue,
    events,
    browser,
    processFn: async (job, done) => {
      log('processing job', job.id)
      const { url } = job.data || {}

      if (!url) throw new Error('missing url')

      const asin = extractAsin(url)
      const pageNumber = extractPage(url)

      try {
        log('scraping', url)
        const { html, json } = readFor(url)
        if (html) log(`using ${htmlPathFor(url)}`)
        let content = html
        let title = ''
        if (/captcha/gi.test(content)) {
          log('found captcha', url)
        }
        if (!content || /captcha/gi.test(content)) {
          page = page || await browser.newPage()
          await page.goto(url)
          content = await page.content()
          title = await page.title()
        }
        if (content && /captcha/gi.test(content)) {
          log('found captcha', url)
          throw new Error('captcha')
        }
        log('content', content && content.substring(0, 250))

        if (json) log(`using ${jsonPathFor(url)}`)

        const reviews = (json || reviewsFromHtml(content))
          .map(r => Object.assign(r, { asin, pageNumber, url, title: r.title || title }))
        log(`parsed ${reviews && reviews.length} reviews page ${asin} ${pageNumber}`)

        saveFor(url, { html: content, json: reviews })

        if (reviews.length === 0) return done(null)

        reviews.map(r => events.emit('review', r))

        const nextUrl = nextPageUrl(content)
        const nextPageNumber = extractPage(nextUrl)
        log({ nextUrl, nextPageNumber })

        if (toPageReached(options.toPage, pageNumber)) {
          log(`toPage ${options.toPage}`)
          return done(null)
        }

        if (nextUrl !== url) await queue.add({ url: nextUrl }, { priority: 1 })
        done(null)
      } catch (err) {
        log(`job failed ${job.id} ${job.data}`, err.message)
        log('taking lock', job.id)
        await job.takeLock()
        log('moving to failed', job.id)
        await job.moveToFailed(new Error(`captcha for "${asin}" on page ${pageNumber}`))
        log('retrying', job.id)
        await job.retry()
        done(new Error(`job failed ${job.id} ${err.message}`))
      }
    }
  })
}

function toPageReached (toPage, pageNumber) {
  return Number.isFinite(toPage) && pageNumber > toPage
}
