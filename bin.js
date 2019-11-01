#!/usr/bin/env node

const amazon = require('./amazon')
const { default: PQueue } = require('p-queue')
const queue = new PQueue({ concurrency: 50, timeout: 30000 })
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
  let lastPageSize = pageSize

  const allReviews = []
  for (; pageNumber < pages && lastPageSize > 0; pageNumber++) {
    log(`Processing ${pageSize} / ${pages}`)
    const asinPageNumberExists = require('fs').existsSync(require('path').resolve(__dirname, 'json', `${asin}-${pageNumber}.json`))

    let productReviews = []
    if (asinPageNumberExists && !process.env.NO_CACHE) {
      log(`Using json/${asin}-${pageNumber}.json`)
      const content = require('fs').readFileSync(require('path').resolve(__dirname, 'json', `${asin}-${pageNumber}.json`), { encoding: 'utf8' })
      productReviews = JSON.parse(content)
    } else {
      log(`Scraping page ${pageNumber} for asin ${asin}`)
      productReviews = await queue.add(() => amazon.getProductReviews({ asin, pageNumber }, { useProxy: true }))
    }

    allReviews.push(...productReviews)

    log(`Found ${productReviews && productReviews.length} product reviews on page ${pageNumber} for asin ${asin}`)
    log(`Accuracy ${((allReviews.length / productReviewsCount) * 100).toFixed(1)}% (${allReviews.length} / ${productReviewsCount})`)

    pageNumber++
    lastPageSize = productReviews.length
  }

  await queue.onIdle()
  log('All work is done')
}
