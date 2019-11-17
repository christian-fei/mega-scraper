const log = require('debug')('sar:scrapers:page')
const browser = require('../browser')
const extractAsin = require('../extract-asin')
const EventEmitter = require('events')
const fs = require('fs')
const path = require('path')
const { parseProductReviews } = require('../parsers/amazon')

module.exports = function amazonComScraper (initialUrl) {
  const hostname = 'amazon.com'
  const asin = extractAsin(initialUrl)

  return {
    async work (queue) {
      const events = new EventEmitter()
      const b = await browser()
      queue.process(async (job, done) => {
        log('processing job', job.id)
        const { asin, pageNumber } = job.data || {}
        const url = productReviewsUrl({ asin, pageNumber })

        log('scraping', url)
        let content = ''
        try {
          const page = await b.newPage(url)

          content = await page.content()
          if (content && /captcha/gi.test(content)) {
            log('found captcha', pageNumber, asin)
            throw new Error('captcha')
          }

          log(`saving html/${asin}/${asin}-${pageNumber}.html`)
          try { fs.mkdirSync(path.resolve(__dirname, '..', '..', 'html', asin)) } catch (err) { }
          try {
            fs.writeFileSync(path.resolve(__dirname, '..', '..', 'html', asin, `${asin}-${pageNumber}.html`), content, { encoding: 'utf8' })
          } catch (err) { console.error(err.message, err.stack) }

          const reviews = parseProductReviews(content)
            .map(r => Object.assign(r, { asin, pageNumber, url }))

          log(`parsed ${reviews && reviews.length} reviews page ${asin} ${pageNumber}`)
          log(`saving json/${asin}/${asin}-${pageNumber}.json`)
          try {
            fs.mkdirSync(path.resolve(__dirname, '..', '..', 'json', asin))
          } catch (err) { }
          try {
            fs.writeFileSync(path.resolve(__dirname, '..', '..', 'json', `${asin}/${asin}-${pageNumber}.json`), JSON.stringify(reviews), { encoding: 'utf8' })
          } catch (err) { console.error(err.message, err.stack) }

          if (reviews.length > 0) {
            reviews.map(r => events.emit('review', r))
            await queue.add({ asin, pageNumber: pageNumber + 1 })
          }
          done()
        } catch (err) {
          log(`job failed ${job.id} ${job.data}`, err.message, err)
          log('taking lock', job.id)
          await job.takeLock()
          log('took lock', job.id)
          log('moving to failed', job.id)
          await job.moveToFailed(new Error(`captcha on ${pageNumber} page for ${asin}`))
          log('moved to failed', job.id)
          log('retrying', job.id)
          await job.retry()
          log('retried', job.id)
          done(new Error(`job failed ${job.id} ${err.message}`))
        }
      })

      queue.add({ asin, pageNumber: 1 }, { attempts: 3, timeout: 5000 })

      queue.on('drained', async function () {
        log('-- queue drained')
        await b.instance.close()
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

      return { queue, events }
    }
  }

  function productReviewsUrl ({ asin, pageNumber = 1 }) {
    return `https://www.amazon.com/product-reviews/${asin}/?pageNumber=${pageNumber}`
  }
}
