const log = require('debug')('mega-scraper:scrapers:amazon.generic')
const withCluster = require('./with-cluster')
const { nextPageUrl } = require('../parsers/amazon')
const { extractAsin, extractPage } = require('../url-logics/amazon')
const { reviewsFromHtml } = require('../parsers/amazon')
const { htmlPathFor, jsonPathFor, saveFor, readFor } = require('../storage/scrape-cache')

module.exports = async function amazonGenericScraperCluster ({ url, queue, events, browser, ...options }) {
  const { cluster } = await withCluster({
    url,
    queue,
    events,
    browser,
    processFn: async ({ page, data }) => {
      const { url } = data || {}
      log('processing job', url)

      if (!url) {
        return events.emit('done', new Error('missing url'))
      }

      const asin = extractAsin(url)
      const pageNumber = extractPage(url)

      try {
        log('scraping', { url, asin, pageNumber })
        const { html, json } = readFor(url)
        if (html) log(`using ${htmlPathFor(url)}`)
        let content = html
        let title = ''
        if (/captcha/gi.test(content)) {
          log('found captcha', url)
        }
        // if (!content || /captcha/gi.test(content)) {
        log('')
        await page.goto(url)
        content = await page.content()
        title = await page.title()
        // }
        if (content && /captcha/gi.test(content)) {
          log('found captcha', url)
          return cluster.queue({ url })
          // return events.emit('done', new Error('captcha'))
        }
        log('content', content && content.substring(0, 250))

        if (json) log(`using ${jsonPathFor(url)}`)

        const reviews = (json || reviewsFromHtml(content))
          .map(r => Object.assign(r, { asin, pageNumber, url, title: r.title || title }))
        log(`parsed ${reviews && reviews.length} reviews page ${asin} ${pageNumber}`)

        saveFor(url, { html: content, json: reviews })

        if (reviews.length === 0) return events.emit('done', null)

        reviews.map(r => events.emit('review', r))

        const nextUrl = nextPageUrl(content)
        const nextPageNumber = extractPage(nextUrl)
        log({ nextUrl, nextPageNumber })

        if (toPageReached(options.toPage, pageNumber)) {
          log(`toPage ${options.toPage}`)
          return events.emit('done', null)
        }

        if (nextUrl !== url) await cluster.queue({ url: nextUrl })
      } catch (err) {
        // log(`job failed ${job.id} ${job.data}`, err.message)
        // log('taking lock', job.id)
        // await job.takeLock()
        // log('moving to failed', job.id)
        // await job.moveToFailed(new Error(`captcha for "${asin}" on page ${pageNumber}`))
        // log('retrying', job.id)
        // await job.retry()
        // done(new Error(`job failed ${job.id} ${err.message}`))
        // throw new Error(err)
        return events.emit('done', err)
      }
    }
  })
}

function toPageReached (toPage, pageNumber) {
  return Number.isFinite(toPage) && pageNumber > toPage
}
