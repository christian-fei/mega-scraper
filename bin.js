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
  initCache({ asin, startingPageNumber, scrapingOptions })

  const productReviewsCount = await amazon.getProductReviewsCount({ asin, pageNumber: startingPageNumber }, scrapingOptions)
  if (!Number.isFinite(productReviewsCount)) {
    log(`invalid reviews count ${productReviewsCount}`)
    throw new Error(`invalid reviews count ${productReviewsCount}`)
  }
  statsCache.hset('productReviewsCount', productReviewsCount)

  let stats = await statsCache.toJSON()

  httpInstance.update(stats)

  const { reviews: firstPageReviews } = await amazon.scrapeProductReviews({ asin, pageNumber: startingPageNumber }, scrapingOptions)

  statsCache.hset('pageSize', firstPageReviews.length)
  statsCache.hset('totalPages', parseInt(productReviewsCount / firstPageReviews.length, 10) + 1)

  httpInstance.update(stats)

  scrapingQueue.on('completed', async (job, result) => {
    statsCache.hset('elapsed', Date.now() - +new Date(stats.start))
    stats = await statsCache.toJSON()
    httpInstance.update(stats)
    log('completed', result)
  })

  scrapingQueue.process(path.resolve(__dirname, 'process-scraping-job.js'))

  stats = await statsCache.toJSON()

  const pageNumbers = Array.from({ length: stats.totalPages - stats.startingPageNumber + 1 }, (_, i) => i + stats.startingPageNumber)

  for (const pageNumber of pageNumbers) {
    log('adding', { pageNumber })
    scrapingQueue.add({ asin, pageNumber, stats, scrapingOptions })
  }
}

function initCache ({ asin, startingPageNumber, scrapingOptions } = {}) {
  statsCache.hset('start', +new Date())
  statsCache.hset('asin', asin)
  statsCache.hset('startingPageNumber', startingPageNumber)
  statsCache.hset('totalPages', 0)
  statsCache.hset('scrapedReviewsCount', 0)
  statsCache.hset('accuracy', 0)
  statsCache.hset('scrapedPages', 0)
  statsCache.hset('elapsed', 0)
  statsCache.hset('scraper', scrapingOptions.puppeteer ? 'puppeteer' : (scrapingOptions.lambda ? 'lambda' : 'url'))
  statsCache.hset('productReviewsCount', 0)
  statsCache.hset('pageSize', 0)
  statsCache.hset('totalPages', 0)
  statsCache.hset('elapsed', 0)
}
