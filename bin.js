#!/usr/bin/env node

const amazon = require('./amazon')
const { default: PQueue } = require('p-queue')
const pLimit = require('p-limit')
const limit = pLimit(6)
const queue = new PQueue({ concurrency: 6, timeout: 30000 })
const log = require('debug')('bin')

main(process.argv[2], process.argv[3])
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    log(err)
    process.exit(1)
  })

async function main (asin, pageNumber = 1) {
  let count = 0
  queue.on('active', () => {
    log(`Working on queue item #${++count}.  Size: ${queue.size}  Pending: ${queue.pending}`)
  })

  const productReviewsCount = await amazon.getProductReviewsCount({ asin, pageNumber }, { useProxy: true })
  if (!Number.isFinite(productReviewsCount)) {
    throw new Error(`invalid reviews count ${productReviewsCount}`)
  }

  const firstPageReviews = await amazon.getProductReviews({ asin, pageNumber }, { useProxy: true })

  const pageSize = firstPageReviews.length
  const pages = parseInt(productReviewsCount / pageSize, 10) + 1

  const tasks = Array.from({ length: pages }, (_, i) => {
    return i + pageNumber
  })

  let noMoreReviewsPageNumber
  let allReviewsCount = 0

  await Promise.all(tasks.map((pageNumber) => limit(async () => {
    if (noMoreReviewsPageNumber) {
      log(`Skipping ${pageNumber} / ${pages} (noMoreReviewsPageNumber ${noMoreReviewsPageNumber})`)
      return []
    }
    log(`Processing ${pageNumber} / ${pages}`)
    const asinPageNumberExists = require('fs').existsSync(require('path').resolve(__dirname, 'json', `${asin}-${pageNumber}.json`))

    let productReviews = []
    if (asinPageNumberExists && !process.env.NO_CACHE) {
      productReviews = await queue.add(() => {
        log(`Using json/${asin}-${pageNumber}.json`)
        const content = require('fs').readFileSync(require('path').resolve(__dirname, 'json', `${asin}-${pageNumber}.json`), { encoding: 'utf8' })
        return JSON.parse(content)
      })
    } else {
      productReviews = await queue.add(() => {
        log(`Scraping page ${pageNumber} for asin ${asin}`)
        return amazon.getProductReviews({ asin, pageNumber }, { useProxy: true })
      })
    }

    allReviewsCount += productReviews.length
    if (productReviews.length === 0 && !noMoreReviewsPageNumber) {
      noMoreReviewsPageNumber = pageNumber
    }

    log(`Found ${productReviews && productReviews.length} product reviews on page ${pageNumber} / ${pages} for asin ${asin}`)

    // pageNumber++
    // lastPageSize = productReviews.length
    log(`Accuracy ${((allReviewsCount / productReviewsCount) * 100).toFixed(1)}% (${allReviewsCount} / ${productReviewsCount})`)
    return productReviews
  })))
    .then((...results) => results.reduce((acc, curr) => acc.concat(curr), []))

  await queue.onIdle()
  log('All work is done')
}
