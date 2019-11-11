#!/usr/bin/env node

const amazon = require('./amazon')
const { server } = require('./server')
const amazonParser = require('./parsers/amazon')
const { default: PQueue } = require('p-queue')
const fs = require('fs')
const path = require('path')
const queue = new PQueue({ concurrency: 2, timeout: 30000 })
const pages = require('./lib/create-queue')('pages')
const debug = require('debug')
const log = debug('sar:bin')
debug.enable('sar:bin,sar:scraper:*,sar:server')

if (require.main === module) {
  main(process.argv[2], process.argv[3])
    .then(() => {
      // process.exit(0)
    })
    .catch((err) => {
      log(err)
      // process.exit(1)
    })
} else {
  module.exports = main
}

async function main (asin, pageNumber = 1) {
  const httpInstance = server()

  const stats = {
    start: new Date().toISOString(),
    elapsed: 0,
    finish: undefined,
    productReviewsCount: 0,
    scrapedReviewsCount: 0,
    accuracy: 0,
    pageSize: 0,
    pageCount: 0,
    lastPageSize: 0,
    pages: 0,
    noMoreReviewsPageNumber: 0,
    reviews: [],
    screenshots: []
  }

  queue.on('active', function () {
    log(`Working on ${stats.pageCount++}. Size: ${queue.size}  Pending: ${queue.pending}`)
  })

  const productReviewsCount = await amazon.getProductReviewsCount({ asin, pageNumber }, { puppeteer: true })
  if (!Number.isFinite(productReviewsCount)) {
    log(`invalid reviews count ${productReviewsCount}`)
    return []
  }
  stats.productReviewsCount = productReviewsCount

  const { reviews: firstPageReviews } = await amazon.scrapeProductReviews({ asin, pageNumber }, { puppeteer: true })

  stats.pageSize = firstPageReviews.length
  stats.pages = parseInt(productReviewsCount / stats.pageSize, 10) + 1

  let allReviewsCount = 0

  log(JSON.stringify(stats, null, 2))
  pages.process(async (job, done) => {
    // console.log('job.data', JSON.stringify(job.data))
    if (stats.noMoreReviewsPageNumber) {
      log(`Skipping ${job.data.pageNumber} / ${stats.pages} (noMoreReviewsPageNumber ${stats.noMoreReviewsPageNumber})`)
      return []
    }
    log(`Processing ${job.data.pageNumber} / ${stats.pages} (lastPageSize ${stats.lastPageSize})`)
    try {
      await scrape({ asin, pageNumber: job.data.pageNumber }).then(processProductReviews({ asin, pageNumber: job.data.pageNumber }))
    } catch (err) {
      log(`failed job ${err.message}`, err)
    }
    Object.assign(stats, { elapsed: Date.now() - +new Date(stats.start) })
    httpInstance.update(stats)
    log(JSON.stringify(pick(stats, ['start', 'elapsed', 'productReviewsCount', 'scrapedReviewsCount', 'accuracy', 'pageSize', 'pageCount', 'lastPageSize', 'pages', 'noMoreReviewsPageNumber']), null, 2))
    done()
  })

  const pageNumbers = Array.from({ length: stats.pages - pageNumber + 1 }, (_, i) => i + pageNumber)

  for (const pageNumber of pageNumbers) {
    await pages.add({ pageNumber })
  }

  async function scrape ({ asin, pageNumber } = {}) {
    if (!asin) throw new Error(`missing asin ${asin}`)
    if (!Number.isFinite(pageNumber)) throw new Error(`missing pageNumber ${pageNumber}`)
    const htmlPath = path.resolve(__dirname, 'html', `${asin}/${asin}-${pageNumber}.html`)
    const jsonPath = path.resolve(__dirname, 'json', `${asin}/${asin}-${pageNumber}.json`)
    const asinPageNumberExistsHTML = fs.existsSync(htmlPath)
    const asinPageNumberExistsJSON = fs.existsSync(jsonPath)

    console.log({ htmlPath, asinPageNumberExistsHTML, jsonPath, asinPageNumberExistsJSON })

    let task
    if (asinPageNumberExistsJSON && !process.env.NO_CACHE) {
      task = queue.add(() => {
        log(`Using html/${asin}-${pageNumber}.html`)
        const content = fs.readFileSync(jsonPath, { encoding: 'utf8' })
        const reviews = JSON.parse(content)
        return { reviews }
      })
    } else if (asinPageNumberExistsHTML && !process.env.NO_CACHE) {
      task = queue.add(async () => {
        log(`Using html/${asin}-${pageNumber}.html`)
        const html = fs.readFileSync(htmlPath, { encoding: 'utf8' })
        const reviews = await amazonParser.parseProductReviews(html)
        return { reviews }
      })
    } else {
      task = queue.add(async () => {
        log(`Scraping page ${pageNumber} for asin ${asin}`)
        return amazon.scrapeProductReviews({ asin, pageNumber }, { puppeteer: true })
      })
    }
    return task
  }

  function processProductReviews ({ asin, pageNumber } = {}) {
    return ({ reviews, screenshotPath }) => {
      allReviewsCount += reviews.length
      if (reviews.length === 0 && stats.noMoreReviewsPageNumber === undefined) {
        stats.noMoreReviewsPageNumber = pageNumber
      }

      stats.lastPageSize = reviews.length
      stats.scrapedReviewsCount += reviews.length

      log(`Found ${reviews && reviews.length} product reviews on page ${pageNumber} / ${stats.pages} for asin ${asin}`)
      const accuracy = (allReviewsCount / productReviewsCount)
      stats.accuracy = accuracy
      stats.reviews = stats.reviews.concat(reviews)
      stats.screenshots = stats.screenshots.concat([screenshotPath])
      stats.reviews.length = 10
      stats.screenshots.length = 10

      log(`Accuracy ${(accuracy / 100).toFixed(1)} (${allReviewsCount} / ${productReviewsCount})`)
      return reviews
    }
  }

  function pick (object, keys) {
    return keys.reduce((acc, key) => Object.assign(acc, { [key]: object[key] }), {})
  }
}
