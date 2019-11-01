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
    log(`Working on item #${++count}.  Size: ${queue.size}  Pending: ${queue.pending}`)
  })

  const productReviewsCount = await amazon.getProductReviewsCount({ asin, pageNumber }, { useProxy: true })
  if (!Number.isFinite(productReviewsCount)) {
    throw new Error(`invalid reviews count ${productReviewsCount}`)
  }

  const firstPageReviews = await amazon.getProductReviews({ asin, pageNumber }, { useProxy: true })

  let productReviews = []
  const allReviews = []
  const pageSize = firstPageReviews.length
  const pages = parseInt(productReviewsCount / pageSize, 10) + 1
  log(`scraping ${pageSize} / ${pages}`)
  let lastPageSize = pageSize

  for (; pageNumber < pages && lastPageSize > 0; pageNumber++) {
    const asinPageNumberExists = require('fs').existsSync(require('path').resolve(__dirname, 'json', `${asin}-${pageNumber}.json`))
    if (asinPageNumberExists && !process.env.NO_CACHE) {
      log(`using json/${asin}-${pageNumber}.json`)
      const content = require('fs').readFileSync(require('path').resolve(__dirname, 'json', `${asin}-${pageNumber}.json`), { encoding: 'utf8' })
      productReviews = JSON.parse(content)
    } else {
      log(`scraping page ${pageNumber} for asin ${asin}`)
      productReviews = await queue.add(() => amazon.getProductReviews({ asin, pageNumber }, { useProxy: true }))
    }

    allReviews.push(...productReviews)
    log(`found ${productReviews && productReviews.length} product reviews on page ${pageNumber} for asin ${asin}`)
    log(`accuracy ${((allReviews.length / productReviewsCount) * 100).toFixed(1)}% (${allReviews.length} / ${productReviewsCount})`)
    pageNumber++
    lastPageSize = productReviews.length
  }

  await queue.onIdle()
  log('All work is done')
  log(`accuracy ${(allReviews.length / productReviewsCount) * 100}%`)
}
