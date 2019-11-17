const log = require('debug')('mega-scraper:scrapers:amazon.it')
const createBrowser = require('../create-browser')
const { nextPageUrl } = require('../parsers/amazon')
const extractAsin = require('../extract-asin')
const extractPage = require('../extract-page')
const EventEmitter = require('events')
const { reviewsFromHtml } = require('../parsers/amazon')
const { htmlPathFor, jsonPathFor, saveHtmlFor, saveJSONFor, readHtmlFor, readJSONFor } = require('../storage/scrape-cache')

module.exports = function amazonItScraper (initialUrl) {
  const hostname = initialUrl.match(/(amazon\.\w+)/)[0]
  const domain = hostname.replace('amazon', '')
  const asin = extractAsin(initialUrl)

  return {
    async work (queue) {
      return paginated({
        queue,
        startUrl: productReviewsUrl({ asin, domain }),
        processFn: function ({ queue, events, browser }) {
          return async (job, done) => {
            log('processing job', job.id)
            const { url } = job.data || {}

            const asin = extractAsin(url)
            const pageNumber = extractPage(url)

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
                browser = browser || await createBrowser()
                const page = await browser.newPage(url)

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
                await queue.add({ url: nextPageUrl(content) }, { priority: 1 })
              }

              done()
            } catch (err) {
              log(`job failed ${job.id} ${job.data}`, err.message, err)
              log('taking lock', job.id)
              await job.takeLock()
              log('moving to failed', job.id)
              await job.moveToFailed(new Error(`captcha for "${asin}" on page ${pageNumber}`))
              log('retrying', job.id)
              await job.retry()
              done(new Error(`job failed ${job.id} ${err.message}`))
            }
          }
        }
      })
    }
  }
}

async function paginated ({ queue, nextPageUrl, startUrl, processFn }) {
  const events = new EventEmitter()
  const browser = await createBrowser()

  queue.process(processFn({ queue, events, browser }))

  queue.add({ url: startUrl }, { attempts: 3, timeout: 5000 })

  queue.on('drained', async function () {
    log('-- queue drained')
    await browser.instance.close()
    events.emit('done')
  })
  queue.on('active', () => log('-- queue active'))
  queue.on('completed', () => log('-- queue completed'))

  return { queue, events }
}

function productReviewsUrl ({ asin, pageNumber = 1, domain = '.it' }) {
  return `https://www.amazon${domain}/product-reviews/${asin}/?pageNumber=${pageNumber}`
}
