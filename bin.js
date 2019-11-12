#!/usr/bin/env node

const amazon = require('./lib/scrapers/amazon')
const { createServer } = require('./server')
const path = require('path')
const statsCache = require('./lib/storage/stats-cache')()
const scrapingQueue = require('./lib/create-queue')('scraping')
scrapingQueue.clean(0, 'wait')
scrapingQueue.clean(0, 'active')
scrapingQueue.clean(0, 'delayed')
scrapingQueue.clean(0, 'failed')
const debug = require('debug')
const log = debug('sar:bin')
debug.enable('sar*')

const scrapingOptions = {
  puppeteer: process.env.USE_PUPPETEER === 'true',
  lambda: process.env.USE_LAMBDA === 'true',
  cache: process.env.USE_CACHE !== 'false',
  useProxy: process.env.USE_PROXY === 'true'
}

if (require.main === module) {
  main(process.argv[2], process.argv[3])
    .then(() => { /* process.exit(0) */ })
    .catch((err) => {
      log(err)
      process.exit(1)
    })
} else {
  module.exports = main
}

async function main (asin, startingPageNumber = 1) {
  log({ asin, startingPageNumber, scrapingOptions })
  const httpInstance = createServer()
  statsCache.set('start', +new Date())
  statsCache.set('asin', asin)
  statsCache.set('startingPageNumber', startingPageNumber)
  statsCache.set('totalPages', 0)
  statsCache.set('scrapedReviewsCount', 0)
  statsCache.set('accuracy', 0)
  statsCache.set('scrapedPages', 0)
  statsCache.set('elapsed', 0)

  const productReviewsCount = await amazon.getProductReviewsCount({ asin, pageNumber: startingPageNumber }, scrapingOptions)
  if (!Number.isFinite(productReviewsCount)) {
    log(`invalid reviews count ${productReviewsCount}`)
    throw new Error(`invalid reviews count ${productReviewsCount}`)
  }
  statsCache.set('productReviewsCount', productReviewsCount)

  let stats = await statsCache.toJSON()

  httpInstance.update(stats)

  const { reviews: firstPageReviews } = await amazon.scrapeProductReviews({ asin, pageNumber: startingPageNumber }, scrapingOptions)

  statsCache.set('pageSize', firstPageReviews.length)
  statsCache.set('totalPages', parseInt(productReviewsCount / firstPageReviews.length, 10) + 1)

  httpInstance.update(stats)
  log(JSON.stringify(stats, null, 2))

  scrapingQueue.on('completed', async (job, result) => {
    log('job result', job.toJSON())
    statsCache.set('scrapedPages', stats.scrapedPages + 1)
    statsCache.set('elapsed', Date.now() - +new Date(stats.start))
    stats = await statsCache.toJSON()

    log(JSON.stringify(pick(stats, ['start', 'elapsed', 'productReviewsCount', 'scrapedReviewsCount', 'accuracy', 'pageSize', 'scrapedPages', 'totalPages', 'noMoreReviewsPageNumber', 'screenshots']), null, 2))
    httpInstance.update(stats)

    log('completed', result)
  })

  scrapingQueue.process(path.resolve(__dirname, 'process-scraping-job.js'))

  stats = await statsCache.toJSON()

  const pageNumbers = Array.from({ length: stats.totalPages - startingPageNumber + 1 }, (_, i) => i + startingPageNumber)

  for (const pageNumber of pageNumbers) {
    log('adding', { pageNumber })
    scrapingQueue.add({ asin, pageNumber, stats, scrapingOptions })
  }
}

function pick (object, keys) {
  return keys.reduce((acc, key) => Object.assign(acc, { [key]: object[key] }), {})
}
