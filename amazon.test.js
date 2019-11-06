const { test } = require('tap')

const {
  fetchSearchHtml,
  getProductDetailsHtml,
  productReviews,
  scrapeProductReviews,
  getProductReviewsCount
} = require('./amazon')

test('get page html content', async t => {
  const html = await fetchSearchHtml({ search: 'porta carta credito' }, { puppeteer: true })
  t.plan(2)
  t.true(typeof html === 'string')
  t.true(html.indexOf('s-search-results'))
})

test('get product details', async t => {
  const html = await getProductDetailsHtml({ asin: 'B07747FR44' }, { puppeteer: true })
  t.plan(2)
  t.true(typeof html === 'string')
  t.true(html.indexOf('B07747FR44'))
})

test('get product reviews', async t => {
  const { body: html } = await productReviews({ asin: 'B07747FR44', pageNumber: 1 }, { puppeteer: true })
  t.plan(2)
  t.true(typeof html === 'string')
  t.true(html.indexOf('B07747FR44'))
})

test('get product reviews count', async t => {
  const count = await getProductReviewsCount({ asin: 'B07747FR44' }, { puppeteer: true })
  t.plan(1)
  t.true(Number.isFinite(count))
})

test('get product reviews paginated', async t => {
  const { body: html } = await productReviews({ asin: 'B07747FR44', pageNumber: 2 }, { puppeteer: true })
  t.plan(2)
  t.true(typeof html === 'string')
  t.true(html.indexOf('B07747FR44'))
})

test('gets reviews from product asin', async t => {
  const { reviews } = await scrapeProductReviews({ asin: 'B07747FR44' }, { puppeteer: true })
  t.plan(6)
  t.true(Array.isArray(reviews))
  t.true(reviews.length > 0)
  const review = reviews[0]
  t.true(!!review)
  t.true(review.stars > 0 && review.stars <= 5)
  t.true(review.dateString)
  t.true(review.text)
})

test('gets reviews from product asin from page 2', async t => {
  const { reviews } = await scrapeProductReviews({ asin: 'B07747FR44', pageNumber: 2 }, { puppeteer: true })
  t.plan(6)
  t.true(Array.isArray(reviews))
  t.true(reviews.length > 0)
  const review = reviews[0]
  t.true(!!review)
  t.true(review.stars > 0 && review.stars <= 5)
  t.true(review.dateString)
  t.true(review.text)
})

test('gets reviews from product asin with proxy', async t => {
  const { reviews } = await scrapeProductReviews({ asin: 'B07747FR44' }, { puppeteer: true })
  t.plan(6)
  t.true(Array.isArray(reviews))
  t.true(reviews.length > 0)
  const review = reviews[0]
  t.true(!!review)
  t.true(review.stars > 0 && review.stars <= 5)
  t.true(review.dateString)
  t.true(review.text)
})
