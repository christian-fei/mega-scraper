const amazon = require('./lib/scrapers/amazon')
const debug = require('debug')
const log = debug('sar:process-scraping-job')
const amazonParser = require('./lib/parsers/amazon')
const fs = require('fs')
const path = require('path')

module.exports = async function (job, done) {
  const { asin, pageNumber, stats, scrapingOptions } = job.data
  log(`Processing ${pageNumber} / ${stats.totalPages}`)
  let reviews = []
  try {
    reviews = await scrape({ asin, pageNumber: pageNumber }, scrapingOptions)
  } catch (err) {
    log(`failed job ${err.message}`, err)
  }
  done(reviews)
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
      const reviews = JSON.parse(content)
      return { reviews }
    } else if (asinPageNumberExistsHTML && options.cache) {
      log(`Using html/${asin}/${asin}-${pageNumber}.html`)
      const html = fs.readFileSync(htmlPath, { encoding: 'utf8' })
      const reviews = await amazonParser.parseProductReviews(html)
      return { reviews }
    }

    log(`Scraping page ${pageNumber} for asin ${asin}`)
    return amazon.scrapeProductReviews({ asin, pageNumber }, scrapingOptions)
      .then(processProductReviews({ asin, pageNumber }))

    function processProductReviews ({ asin, pageNumber } = {}) {
      return ({ reviews, screenshotPath }) => {
        if (reviews.length === 0 && stats.noMoreReviewsPageNumber === undefined) {
          stats.noMoreReviewsPageNumber = pageNumber
        }

        stats.scrapedReviewsCount += reviews.length

        log(`Found ${reviews && reviews.length} product reviews on page ${pageNumber} / ${stats.totalPages} for asin ${asin}`)
        const accuracy = (stats.scrapedReviewsCount / stats.productReviewsCount)
        stats.accuracy = accuracy
        stats.reviews = stats.reviews.concat(reviews)
        log({ screenshotPath })
        stats.screenshots = stats.screenshots.concat([screenshotPath]).filter(Boolean)
        stats.reviews = stats.reviews.slice(-10)
        stats.screenshots = stats.screenshots.slice(-10)

        log(`Accuracy ${(accuracy).toFixed(1)} (${stats.scrapedReviewsCount} / ${stats.productReviewsCount})`)
        return reviews
      }
    }
  }
}
