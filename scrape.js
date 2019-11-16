#!/usr/bin/env node

const log = require('debug')('sar:scrape')
const EventEmitter = require('events')
const { URL } = require('url')
const fs = require('fs')
const argv = require('yargs').argv
const path = require('path')
const browser = require('./lib/browser')
const createQueue = require('./lib/create-queue')
const { parseProductReviews } = require('./lib/parsers/amazon')

const scraperFor = {
  'www.amazon.it': amazonItScraper
}

if (require.main === module) {
  scrape(argv._[0])
} else {
  module.exports = scrape
}

async function scrape (url) {
  log('url', url)
  const { hostname } = new URL(url)
  log('hostname', hostname)
  const scraper = scraperFor[hostname] || pageScraper
  if (!scraper) throw new Error('unsupported url')

  const queueId = getQueueId(url)
  log(`queueId : bull:${queueId}`)
  const queue = createQueue(queueId)
  queue.clean(0, 'wait')
  queue.clean(0, 'active')
  queue.clean(0, 'delayed')
  queue.clean(0, 'failed')

  log('starting scraping', url)

  const { events } = await scraper(url).work(queue)

  events.on('done', () => {
    console.log('done')
    process.exit(0)
  })
  events.on('review', (review) => {
    console.log('new review', review)
  })
  events.on('content', (content) => {
    console.log('new review', (content || '').substring(0, 250))
  })
}

function getQueueId (url) {
  const asin = extractAsin(url)
  if (asin) return `scrape_${asin}`
  return `scrape_${guid()}`
}

function guid () {
  return (s4() + s4() + '-' + s4() + '-4' + s4().substr(0, 3) + '-' + s4() + '-' + s4() + s4() + s4()).toLowerCase()
  function s4 () {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
  }
}

function pageScraper (url) {
  return {
    async work (queue) {
      const events = new EventEmitter()
      const b = await browser()
      log('scraping', url)
      let content = ''
      const page = await b.newPage(url)

      content = await page.content()
      if (content && /captcha/gi.test(content)) {
        log('found captcha', url)
        throw new Error('captcha')
      }

      log(`saving html/${normalizedUrl(url)}.html`)
      try {
        fs.writeFileSync(path.resolve(__dirname, 'html', `${normalizedUrl(url)}.html`), content, { encoding: 'utf8' })
      } catch (err) { console.error(err.message, err.stack) }

      await b.instance.close()

      process.nextTick(() => {
        events.emit('content', content)

        events.emit('done', content)
      })

      return { events }
    }
  }
}

function amazonItScraper (initialUrl) {
  const hostname = 'amazon.it'
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
          try { fs.mkdirSync(path.resolve(__dirname, 'html', asin)) } catch (err) { }
          try {
            fs.writeFileSync(path.resolve(__dirname, 'html', asin, `${asin}-${pageNumber}.html`), content, { encoding: 'utf8' })
          } catch (err) { console.error(err.message, err.stack) }

          const reviews = parseProductReviews(content)
            .map(r => Object.assign(r, { asin, pageNumber, url }))

          log(`parsed ${reviews && reviews.length} reviews page ${asin} ${pageNumber}`)
          log(`saving json/${asin}/${asin}-${pageNumber}.json`)
          try {
            fs.mkdirSync(path.resolve(__dirname, 'json', asin))
          } catch (err) { }
          try {
            fs.writeFileSync(path.resolve(__dirname, 'json', `${asin}/${asin}-${pageNumber}.json`), JSON.stringify(reviews), { encoding: 'utf8' })
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
    return `https://www.amazon.it/product-reviews/${asin}/?pageNumber=${pageNumber}`
  }
}

function extractAsin (url) {
  const match = url.match(/\/dp\/(\w+)/)
  return Array.isArray(match) ? match[1] : null
}

function normalizedUrl (url) {
  return (url || '').replace(/\//gi, '!')
}

process.on('unhandledRejection', (err) => {
  log('unhandled rejection', err.message, err)
})

process.on('uncaughtException', (err) => {
  log('uncaught exception', err.message, err)
})
