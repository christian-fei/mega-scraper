const log = require('debug')('sar:scrapers:amazon.com')
const createBrowser = require('../create-browser')
const extractAsin = require('../extract-asin')
const EventEmitter = require('events')
const { reviewsFromHtml } = require('../parsers/amazon')
const { htmlPathFor, jsonPathFor, saveHtmlFor, saveJSONFor, readHtmlFor, readJSONFor } = require('../storage/scrape-cache')

module.exports = function amazonComScraper (initialUrl) {
  const hostname = 'amazon.com'
  const asin = extractAsin(initialUrl)

  return {
    async work (queue) {
      const events = new EventEmitter()
      let browser
      queue.process(async (job, done) => {
        log('processing job', job.id)
        const { asin, pageNumber } = job.data || {}
        const url = productReviewsUrl({ asin, pageNumber })

        try {
          log('scraping', url)
          const htmlContent = readHtmlFor(url)
          log(htmlContent)
          const jsonContent = readJSONFor(url)
          if (htmlContent) log(`using ${htmlPathFor(url)}`)
          let content = htmlContent
          if (/captcha/gi.test(content)) {
            log('found captcha', pageNumber, asin)
          }
          if (!content || /captcha/gi.test(content)) {
            browser = browser || await createBrowser()
            const page = await browser.newPage(url)

            content = await page.content()
          }
          if (content && /captcha/gi.test(content)) {
            log('found captcha', pageNumber, asin)
            throw new Error('captcha')
          }

          saveHtmlFor(url, content)

          if (jsonContent) log(`using ${jsonPathFor(url)}`)

          const reviews = (jsonContent || reviewsFromHtml(content))
            .map(r => Object.assign(r, { asin, pageNumber, url }))
          log(`parsed ${reviews && reviews.length} reviews page ${asin} ${pageNumber}`)

          saveJSONFor(url, reviews)

          if (reviews.length > 0) {
            reviews.map(r => events.emit('review', r))
            await queue.add({ asin, pageNumber: pageNumber + 1 })
          }

          done()
        } catch (err) {
          log(`job failed ${job.id} ${job.data}`, err.message, err)
          log('taking lock', job.id)
          await job.takeLock()
          log('moving to failed', job.id)
          await job.moveToFailed(new Error(`captcha on ${pageNumber} page for ${asin}`))
          log('retrying', job.id)
          await job.retry()
          done(new Error(`job failed ${job.id} ${err.message}`))
        }
      })

      queue.add({ asin, pageNumber: 1 }, { attempts: 3, timeout: 5000 })

      queue.on('drained', async function () {
        log('-- queue drained')
        browser && await browser.instance.close()
        events.emit('done')
      })
      queue.on('active', function () {
        log('-- queue active')
      })
      queue.on('completed', function () {
        log('-- queue completed')
      })

      log('asin', asin)
      log('hostname', hostname)

      return { queue, browser, events }
    }
  }

  function productReviewsUrl ({ asin, pageNumber = 1 }) {
    return `https://www.amazon.com/product-reviews/${asin}/?pageNumber=${pageNumber}`
  }
}
