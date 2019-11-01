#!/usr/bin/env node

const amazon = require('./amazon')
const amazonParser = require('./parsers/amazon')
const { default: PQueue } = require('p-queue')
const pLimit = require('p-limit')
const fs = require('fs')
const path = require('path')
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

  const productReviewsCount = await amazon.getProductReviewsCount({ asin, pageNumber }, { useProxy: true })
  if (!Number.isFinite(productReviewsCount)) {
    throw new Error(`invalid reviews count ${productReviewsCount}`)
  }
  stats.productReviewsCount = productReviewsCount

  const firstPageReviews = await amazon.getProductReviews({ asin, pageNumber }, { useProxy: true })

  stats.pageSize = firstPageReviews.length
  const pages = parseInt(productReviewsCount / stats.pageSize, 10) + 1
  stats.pages = pages

  const tasks = Array.from({ length: pages }, (_, i) => i + pageNumber)

  let allReviewsCount = 0

  await Promise.all(tasks.map((pageNumber) => limit(async () => {
    if (stats.noMoreReviewsPageNumber) {
      log(`Skipping ${pageNumber} / ${pages} (noMoreReviewsPageNumber ${stats.noMoreReviewsPageNumber})`)
      return []
    }
    log(`Processing ${pageNumber} / ${pages}`)
    const asinPageNumberExistsHTML = fs.existsSync(path.resolve(__dirname, 'html', `${asin}-${pageNumber}.html`))
    const asinPageNumberExistsJSON = fs.existsSync(path.resolve(__dirname, 'json', `${asin}-${pageNumber}.json`))

    let task
    if (asinPageNumberExistsJSON && !process.env.NO_CACHE) {
      task = queue.add(() => {
        log(`Using html/${asin}-${pageNumber}.html`)
        const content = fs.readFileSync(path.resolve(__dirname, 'json', `${asin}-${pageNumber}.json`), { encoding: 'utf8' })
        return JSON.parse(content)
      })
    } else if (asinPageNumberExistsHTML && !process.env.NO_CACHE) {
      task = queue.add(() => {
        log(`Using html/${asin}-${pageNumber}.html`)
        const html = fs.readFileSync(path.resolve(__dirname, 'html', `${asin}-${pageNumber}.html`), { encoding: 'utf8' })
        return amazonParser.parseProductReviews(html)
      })
    } else {
      task = queue.add(() => {
        log(`Scraping page ${pageNumber} for asin ${asin}`)
        return amazon.getProductReviews({ asin, pageNumber }, { useProxy: true })
      })
    }

    return task.then(productReviews => {
      allReviewsCount += productReviews.length
      if (productReviews.length === 0 && !stats.noMoreReviewsPageNumber) {
        stats.noMoreReviewsPageNumber = pageNumber
      }

      log(`Found ${productReviews && productReviews.length} product reviews on page ${pageNumber} / ${pages} for asin ${asin}`)

      log(`Accuracy ${((allReviewsCount / productReviewsCount) * 100).toFixed(1)}% (${allReviewsCount} / ${productReviewsCount})`)
      return productReviews
    })
  })))
    .then((...results) => results.reduce((acc, curr) => acc.concat(curr), []))

  await queue.onIdle()
  log('All work is done')
}
