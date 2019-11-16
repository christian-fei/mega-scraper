#!/usr/bin/env node

const log = require('debug')('sar:scrape')
const { URL } = require('url')
const fs = require('fs')
const path = require('path')
const browser = require('./lib/browser')
const createQueue = require('./lib/create-queue')
const { parseProductReviews } = require('./lib/parsers/amazon')

const scraperFor = {
  'www.amazon.it': amazonItScraper
}

if (require.main === module) {
  scrape(process.argv[2], (reviews) => {
    console.log('new reviews', reviews)
  }, () => {
    process.exit(0)
  })
    .then(() => {
    })
} else {
  module.exports = scrape
}

async function scrape (url, onNewReviews = Function.prototype, done = Function.prototype) {
  log('url', url)
  const { hostname } = new URL(url)
  log('hostname', hostname)
  const scraper = scraperFor[hostname]
  if (!scraper) throw new Error('unsupported url')

  const queueId = getQueueId(url)
  log(`queueId : bull:${queueId}`)
  const queue = createQueue(queueId)
  queue.clean(0, 'wait')
  queue.clean(0, 'active')
  queue.clean(0, 'delayed')
  queue.clean(0, 'failed')

  log('starting scraping', url)

  return scraper(url).work(queue, onNewReviews, done)
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

function amazonItScraper (initialUrl) {
  const hostname = 'amazon.it'
  const asin = extractAsin(initialUrl)

  return {
    async work (queue, onNewReviews = Function.prototype, done = Function.prototype) {
      const b = await browser()
      queue.process(async (job, done) => {
        log('processing job', job.id)
        const { asin, pageNumber } = job.data || {}
        const url = productReviewsUrl({ asin, pageNumber })
        // const normalizedUrl = url.replace(/\//gi, '|')

        log('scraping', url)
        const page = await b.newPage(url)

        const content = await page.content()
        log(`saving html/${asin}/${asin}-${pageNumber}.html`)
        try { fs.mkdirSync(path.resolve(__dirname, 'html', asin)) } catch (err) { }
        try {
          fs.writeFileSync(path.resolve(__dirname, 'html', asin, `${asin}-${pageNumber}.html`), content, { encoding: 'utf8' })
        } catch (err) { console.error(err.message, err.stack) }

        const reviews = parseProductReviews(content)
          .map(r => Object.assign(r, { asin, pageNumber, url }))
        onNewReviews(reviews)
        log(`parsed ${reviews && reviews.length} reviews`)
        log(`saving json/${asin}/${asin}-${pageNumber}.json`)
        try {
          fs.mkdirSync(path.resolve(__dirname, 'json', asin))
        } catch (err) { }
        try {
          fs.writeFileSync(path.resolve(__dirname, 'json', `${asin}/${asin}-${pageNumber}.json`), JSON.stringify(reviews), { encoding: 'utf8' })
        } catch (err) { console.error(err.message, err.stack) }

        // await page.close()
        if (reviews.length > 0) {
          await queue.add({ asin, pageNumber: pageNumber + 1 })
        }
        done()
      })

      queue.add({ asin, pageNumber: 1 })

      queue.on('drained', async function () {
        log('-- queue drained')
        await b.instance.close()
        done()
      })
      queue.on('active', function () {
        log('-- queue active')
      })
      queue.on('completed', function () {
        log('-- queue completed')
      })

      log('asin', asin)
      log('hostname', hostname)

      return queue
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
