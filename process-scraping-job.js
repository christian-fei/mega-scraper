const amazon = require('lib/sites/amazon')
const debug = require('debug')
const log = debug('sar:process-scraping-job')
const amazonParser = require('lib/parsers/amazon')
const fs = require('fs')
const path = require('path')
const cache = require('lib/storage/cache')

module.exports = async function (job, done) {
  const { asin, pageNumber, scrapingOptions } = job.data
  const statsCache = cache(`stats/${asin}`)
  let stats = await statsCache.toJSON()

  log(`Processing ${pageNumber} / ${stats.totalPages}`)
  let reviews = []
  try {
    reviews = await scrape({ asin, pageNumber: pageNumber }, scrapingOptions)
  } catch (err) {
    log(`failed job ${err.message}`, err)
  }
  done()
  return reviews

  async function scrape ({ asin, pageNumber } = {}, options = { cache: true }) {
    if (!asin) throw new Error(`missing asin ${asin}`)
    if (!Number.isFinite(pageNumber)) throw new Error(`missing pageNumber ${pageNumber}`)
    const htmlPath = path.resolve(__dirname, 'html', `${asin}/${asin}-${pageNumber}.html`)
    const jsonPath = path.resolve(__dirname, 'json', `${asin}/${asin}-${pageNumber}.json`)
    const asinPageNumberExistsHTML = fs.existsSync(htmlPath)
    const asinPageNumberExistsJSON = fs.existsSync(jsonPath)

    log({ htmlPath, asinPageNumberExistsHTML, jsonPath, asinPageNumberExistsJSON })

    if (asinPageNumberExistsJSON && options.cache) {
      log(`Using json/${asin}/${asin}-${pageNumber}.json`)
      const content = fs.readFileSync(jsonPath, { encoding: 'utf8' })
      const { reviews } = await processProductReviews({ asin, pageNumber })({ reviews: JSON.parse(content) })
      return { reviews }
    } else if (asinPageNumberExistsHTML && options.cache) {
      log(`Using html/${asin}/${asin}-${pageNumber}.html`)
      const html = fs.readFileSync(htmlPath, { encoding: 'utf8' })
      const { reviews } = await amazonParser.reviewsFromHtml(html)
        .then(processProductReviews({ asin, pageNumber }))
      return { reviews }
    }

    log(`Scraping page ${pageNumber} for asin ${asin}`)
    const { reviews } = await amazon.scrapeProductReviews({ asin, pageNumber }, scrapingOptions)
      .then(processProductReviews({ asin, pageNumber }))

    return { reviews }

    function processProductReviews ({ asin, pageNumber } = {}) {
      return async ({ reviews, screenshotPath }) => {
        stats = await statsCache.toJSON()
        if (reviews.length === 0 && stats.noMoreReviewsPageNumber === undefined) {
          statsCache.hset('noMoreReviewsPageNumber', pageNumber)
        }

        statsCache.hincrby('scrapedReviewsCount', reviews.length)
        stats.scrapedReviewsCount += reviews.length

        log(`Found ${reviews && reviews.length} product reviews on page ${pageNumber} / ${stats.totalPages} for asin ${asin}`)
        const accuracy = (stats.scrapedReviewsCount / stats.productReviewsCount)
        statsCache.hset('accuracy', accuracy)
        statsCache.hincrby('scrapedPages', 1)

        screenshotPath && log(`Screenshot for "${asin}" page ${pageNumber} saved to ${screenshotPath}`)

        log(`Accuracy ${(accuracy).toFixed(1)} (${stats.scrapedReviewsCount} / ${stats.productReviewsCount})`)
        return { reviews, screenshotPath }
      }
    }
  }
}
