const amazon = require('./lib/scrapers/amazon')
const debug = require('debug')
const log = debug('sar:process-scraping-job')
const amazonParser = require('./lib/parsers/amazon')
const fs = require('fs')
const path = require('path')
const statsCache = require('./lib/storage/stats-cache')()

module.exports = async function (job, done) {
  const { asin, pageNumber, scrapingOptions } = job.data
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
      const reviews = JSON.parse(content)
      return { reviews }
    } else if (asinPageNumberExistsHTML && options.cache) {
      log(`Using html/${asin}/${asin}-${pageNumber}.html`)
      const html = fs.readFileSync(htmlPath, { encoding: 'utf8' })
      const reviews = await amazonParser.parseProductReviews(html)
      return { reviews }
    }

    log(`Scraping page ${pageNumber} for asin ${asin}`)
    const reviews = await amazon.scrapeProductReviews({ asin, pageNumber }, scrapingOptions)
      .then(processProductReviews({ asin, pageNumber }))

    return { reviews }

    function processProductReviews ({ asin, pageNumber } = {}) {
      return async ({ reviews, screenshotPath }) => {
        stats = await statsCache.toJSON()
        log('stats', stats)
        if (reviews.length === 0 && stats.noMoreReviewsPageNumber === undefined) {
          statsCache.set('noMoreReviewsPageNumber', pageNumber)
        }

        stats.scrapedReviewsCount = stats.scrapedReviewsCount + reviews.length
        statsCache.set('scrapedReviewsCount', stats.scrapedReviewsCount)

        log(`Found ${reviews && reviews.length} product reviews on page ${pageNumber} / ${stats.totalPages} for asin ${asin}`)
        const accuracy = (parseInt(stats.scrapedReviewsCount) / parseInt(stats.productReviewsCount))
        statsCache.set('accuracy', accuracy)
        log({ screenshotPath })
        // stats.reviews = stats.reviews.concat(reviews).filter(Boolean)
        // stats.screenshots = stats.screenshots.concat([screenshotPath]).filter(Boolean)
        // stats.reviews = stats.reviews.slice(-10)
        // stats.screenshots = stats.screenshots.slice(-10)

        log(`Accuracy ${(accuracy).toFixed(1)} (${stats.scrapedReviewsCount} / ${stats.productReviewsCount})`)
        return reviews
      }
    }
  }
}
