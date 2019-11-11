#!/usr/bin/env node

const amazon = require('./lib/scrapers/amazon')
const { createServer } = require('./server')
const path = require('path')
const pages = require('./lib/create-queue')('pages')
pages.clean(0, 'wait')
pages.clean(0, 'active')
pages.clean(0, 'delayed')
pages.clean(0, 'failed')
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
  const stats = createStats()

  const productReviewsCount = await amazon.getProductReviewsCount({ asin, pageNumber: startingPageNumber }, scrapingOptions)
  if (!Number.isFinite(productReviewsCount)) {
    log(`invalid reviews count ${productReviewsCount}`)
    throw new Error(`invalid reviews count ${productReviewsCount}`)
  }
  stats.productReviewsCount = productReviewsCount
  httpInstance.update(stats)

  const { reviews: firstPageReviews } = await amazon.scrapeProductReviews({ asin, pageNumber: startingPageNumber }, scrapingOptions)

  stats.pageSize = firstPageReviews.length
  stats.totalPages = parseInt(productReviewsCount / stats.pageSize, 10) + 1

  httpInstance.update(stats)
  log(JSON.stringify(stats, null, 2))

  pages.process(path.resolve(__dirname, 'process-scraping-job.js'))

  pages.on('completed', function (job, result) {
    log('job result', result)
    Object.assign(stats, { scrapedPages: stats.scrapedPages + 1 })
    Object.assign(stats, { elapsed: Date.now() - +new Date(stats.start) })
    log(JSON.stringify(pick(stats, ['start', 'elapsed', 'productReviewsCount', 'scrapedReviewsCount', 'accuracy', 'pageSize', 'scrapedPages', 'totalPages', 'noMoreReviewsPageNumber', 'screenshots']), null, 2))
    httpInstance.update(stats)

    log('completed', result)
  })

  const pageNumbers = Array.from({ length: stats.totalPages - startingPageNumber + 1 }, (_, i) => i + startingPageNumber)

  for (const pageNumber of pageNumbers) {
    log('adding', { pageNumber })
    await pages.add({ asin, pageNumber, stats, scrapingOptions })
  }

  function createStats () {
    return {
      asin,
      startingPageNumber,
      start: new Date().toISOString(),
      elapsed: 0,
      finish: undefined,
      productReviewsCount: 0,
      scrapedReviewsCount: 0,
      accuracy: 0,
      pageSize: 0,
      scrapedPages: 0,
      totalPages: 0,
      noMoreReviewsPageNumber: 0,
      reviews: [],
      screenshots: []
    }
  }
}

function pick (object, keys) {
  return keys.reduce((acc, key) => Object.assign(acc, { [key]: object[key] }), {})
}
