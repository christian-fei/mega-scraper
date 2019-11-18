const log = require('debug')('mega-scraper:scrapers:amazon.generic')
const paginated = require('./paginated')
const { nextPageUrl } = require('../parsers/amazon')
const extractAsin = require('../extract-asin')
const extractPage = require('../extract-page')
const { reviewsFromHtml } = require('../parsers/amazon')
const { htmlPathFor, jsonPathFor, saveHtmlFor, saveJSONFor, readHtmlFor, readJSONFor } = require('../storage/scrape-cache')

module.exports = async function amazonGenericScraper ({ url, queue, events, browser, ...options }) {
  const hostname = url.match(/(amazon\.\w+)/)[0]
  const domain = hostname.replace('amazon', '')
  const asin = extractAsin(url)

  let page

  return paginated({
    ...options,
    queue,
    events,
    browser,
    url: productReviewsUrl({ asin, domain }),
    processFn: async (job, done) => {
      log('processing job', job.id)
      const { url } = job.data || {}

      if (!url) throw new Error('missing url')

      const asin = extractAsin(url)
      const pageNumber = extractPage(url)
      if (Number.isFinite(options.toPage) && pageNumber > options.toPage) {
        log(`toPage ${options.toPage}`)
        return done(null)
      }

      try {
        log('scraping', url)
        const htmlContent = readHtmlFor(url)
        const jsonContent = readJSONFor(url)
        if (htmlContent) log(`using ${htmlPathFor(url)}`)
        let content = htmlContent
        if (/captcha/gi.test(content)) {
          log('found captcha', pageNumber, asin)
        }
        let title = ''
        if (!content || /captcha/gi.test(content)) {
          page = page || await browser.newPage()
          await page.goto(url)
          content = await page.content()
          title = await page.title()
        }
        if (content && /captcha/gi.test(content)) {
          log('found captcha', pageNumber, asin)
          throw new Error('captcha')
        }
        log('content', content && content.substring(0, 250))

        saveHtmlFor(url, content)

        if (jsonContent) log(`using ${jsonPathFor(url)}`)

        const reviews = (jsonContent || reviewsFromHtml(content))
          .map(r => Object.assign(r, { asin, pageNumber, url, title: r.title || title }))
        log(`parsed ${reviews && reviews.length} reviews page ${asin} ${pageNumber}`)

        saveJSONFor(url, reviews)

        if (reviews.length > 0) {
          reviews.map(r => events.emit('review', r))

          const nextUrl = nextPageUrl(content)
          log({ nextUrl })
          if (nextUrl) {
            console.log({ nextUrl, url })
            if (nextUrl !== url) {
              await queue.add({ url: nextUrl }, { priority: 1 })
            }
          }
        }

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

function productReviewsUrl ({ asin, pageNumber = 1, domain = '.it' }) {
  return `https://www.amazon${domain}/product-reviews/${asin}/?pageNumber=${pageNumber}`
}
