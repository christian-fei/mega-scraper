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

  let productReviews = []
  const allReviews = []
  let pageCount = 11
  log('productReviewsCount', productReviewsCount, 'pageCount', pageCount)
  for (let i = pageCount; i < productReviewsCount; i += pageCount) {
    log(`scraping page ${pageNumber} for asin ${asin}`)
    const asinPageNumberExists = require('fs').existsSync(require('path').resolve(__dirname, 'json', `${asin}-${pageNumber}.json`))
    if (asinPageNumberExists && !process.env.NO_CACHE) {
      log(`using json/${asin}-${pageNumber}.json`)
      const content = require('fs').readFileSync(require('path').resolve(__dirname, 'json', `${asin}-${pageNumber}.json`), { encoding: 'utf8' })
      productReviews = JSON.parse(content)
    } else {
      productReviews = await queue.add(() => amazon.getProductReviews({ asin, pageNumber }, { useProxy: true }))
    }

    log(`found ${productReviews && productReviews.length} product reviews on page ${pageNumber} for asin ${asin}`)
    pageNumber++
    allReviews.push(...productReviews)
    pageCount = productReviews.length
    log(`total reviews ${allReviews.length}`)
    // productReviews.forEach(p => log(`${p.text.substring(0, 100)}`))
  }

  await queue.onIdle()
  log('All work is done')
}
