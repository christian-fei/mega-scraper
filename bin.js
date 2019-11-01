#!/usr/bin/env node

const amazon = require('./amazon')
const { server } = require('./server')
const amazonParser = require('./parsers/amazon')
const { default: PQueue } = require('p-queue')
const pLimit = require('p-limit')
const fs = require('fs')
const path = require('path')
const limit = pLimit(6)
const queue = new PQueue({ concurrency: 6, timeout: 30000 })
const log = require('debug')('sar:bin')

if (require.main === module) {
  main(process.argv[2], process.argv[3])
  // .then(() => {
  //   process.exit(0)
  // })
  // .catch((err) => {
  //   log(err)
  //   process.exit(1)
  // })
} else {
  module.exports = main
}

async function main (asin, pageNumber = 1) {
  server()

  const stats = {
    count: 0,
    productReviewsCount: 0,
    pageSize: 0,
    pages: 0,
    noMoreReviewsPageNumber: 0
  }

  queue.on('active', () => {
    log(`Working on queue item #${++stats.count}.  Size: ${queue.size}  Pending: ${queue.pending}`)
  })

  const productReviewsCount = await amazon.getProductReviewsCount({ asin, pageNumber })
  if (!Number.isFinite(productReviewsCount)) {
    log(`invalid reviews count ${productReviewsCount}`)
    return []
  }
  stats.productReviewsCount = productReviewsCount

  const firstPageReviews = await amazon.getProductReviews({ asin, pageNumber })

  stats.pageSize = firstPageReviews.length
  const pages = parseInt(productReviewsCount / stats.pageSize, 10) + 1
  stats.pages = pages

  const tasks = Array.from({ length: pages }, (_, i) => i + pageNumber)

  let allReviewsCount = 0

  const allReviews = await Promise.all(tasks.map((pageNumber) => limit(async () => {
    if (stats.noMoreReviewsPageNumber) {
      log(`Skipping ${pageNumber} / ${pages} (noMoreReviewsPageNumber ${stats.noMoreReviewsPageNumber})`)
      return []
    }
    log(`Processing ${pageNumber} / ${pages}`)
    const task = processJob({ asin, pageNumber })

    server.update(stats)

    return task.then(processProductReviews)
  })))
    .then((...results) => results.reduce((acc, curr) => acc.concat(curr), []))

  await queue.onIdle()
  log('All work is done')
  log(JSON.stringify(stats, null, 2))

  return allReviews

  async function processJob ({ asin, pageNumber } = {}) {
    const htmlPath = path.resolve(__dirname, 'html', `${asin}-${pageNumber}.html`)
    const jsonPath = path.resolve(__dirname, 'json', `${asin}-${pageNumber}.json`)
    const asinPageNumberExistsHTML = fs.existsSync(htmlPath)
    const asinPageNumberExistsJSON = fs.existsSync(jsonPath)

    let task
    if (asinPageNumberExistsJSON && !process.env.NO_CACHE) {
      task = queue.add(() => {
        log(`Using html/${asin}-${pageNumber}.html`)
        const content = fs.readFileSync(jsonPath, { encoding: 'utf8' })
        return JSON.parse(content)
      })
    } else if (asinPageNumberExistsHTML && !process.env.NO_CACHE) {
      task = queue.add(() => {
        log(`Using html/${asin}-${pageNumber}.html`)
        const html = fs.readFileSync(htmlPath, { encoding: 'utf8' })
        return amazonParser.parseProductReviews(html)
      })
    } else {
      task = queue.add(() => {
        log(`Scraping page ${pageNumber} for asin ${asin}`)
        return amazon.getProductReviews({ asin, pageNumber })
      })
    }
    return task
  }

  function processProductReviews (productReviews) {
    allReviewsCount += productReviews.length
    if (productReviews.length === 0 && stats.noMoreReviewsPageNumber === undefined) {
      stats.noMoreReviewsPageNumber = pageNumber
    }

    log(`Found ${productReviews && productReviews.length} product reviews on page ${pageNumber} / ${pages} for asin ${asin}`)

    log(`Accuracy ${((allReviewsCount / productReviewsCount) * 100).toFixed(1)}% (${allReviewsCount} / ${productReviewsCount})`)
    return productReviews
  }
}
