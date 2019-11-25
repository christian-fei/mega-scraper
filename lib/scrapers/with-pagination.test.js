const test = require('ava')
const withPagination = require('./with-pagination')
const EventEmitter = require('events')
const { createQueue } = require('../queue')
const { productReviewsUrl } = require('../url-logics/amazon')
const createBrowser = require('../browser/create-browser')

test.skip('scrapes url https://www.amazon.it/Echo-Dot-generazione-Altoparlante-intelligente/product-reviews/B07PHPXHQS/', async t => {
  const events = new EventEmitter()
  const queue = createQueue('test_amazon_pagination')
  const browser = await createBrowser({ headless: true, proxy: true, images: false, javascript: false, stylesheets: false, timeout: 1000, blocker: true })

  withPagination({
    url: 'https://www.amazon.it/Echo-Dot-generazione-Altoparlante-intelligente/product-reviews/B07PHPXHQS/',
    toPage: 5,
    events,
    queue,
    browser,
    getUrls: async ({ url, page }) => {
      await page.goto(url)
      const selectors = ['#acrCustomerReviewText', '.averageStarRatingNumerical'].join(',')
      console.log('looking for selectors', selectors)
      await page.waitForSelector(selectors)
      console.log('found selectors', selectors)
      const label = await page.$eval(selectors, n => n && n.innerText)
      console.log('label', label)
      console.log('label found', label)
      const string = label && label.replace(/[^\d]+/g, '')
      const productReviewsCount = parseInt(string, 10)
      console.log({ string, productReviewsCount })
      if (!Number.isFinite(productReviewsCount)) return []
      const pages = parseInt(productReviewsCount / 10) + 1
      console.log('pages', pages)
      const pageNumbers = Array.from({ length: pages }, (_, i) => i + 1)
      return pageNumbers.map(pageNumber => productReviewsUrl({ url, pageNumber }))
    }
  })

  const scrapedReviews = []
  return new Promise((resolve, reject) => {
    events.on('review', (review) => {
      scrapedReviews.push(review)
      t.truthy(review)
    })
    events.on('done', (result) => {
      t.is(result.toPageReached, true)
      t.is(result.toPage, 5)
      t.is(scrapedReviews.length, 50)
      resolve(result)
    })
  })
})
