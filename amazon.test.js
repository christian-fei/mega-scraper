const { test } = require('tap')

const {
  fetchSearchHtml,
  getProductDetailsHtml,
  getProductReviewsHtml,
  getProductReviews,
  getProductReviewsCount
} = require('./amazon')

test('get page html content', async t => {
  const html = await fetchSearchHtml({ search: 'porta carta credito' }, { useProxy: true })
  t.plan(2)
  t.true(typeof html === 'string')
  t.true(html.indexOf('s-search-results'))
})

test('get product details', async t => {
  const html = await getProductDetailsHtml({ asin: 'B07JML91PY' }, { useProxy: true })
  t.plan(2)
  t.true(typeof html === 'string')
  t.true(html.indexOf('B07JML91PY'))
})

test('get product reviews', async t => {
  const html = await getProductReviewsHtml({ asin: 'B07JML91PY', pageNumber: 1 }, { useProxy: true })
  t.plan(2)
  t.true(typeof html === 'string')
  t.true(html.indexOf('B07JML91PY'))
})

test('get product reviews count', async t => {
  const count = await getProductReviewsCount({ asin: 'B07JML91PY' }, { useProxy: true })
  t.plan(1)
  t.true(Number.isFinite(count))
})

test('get product reviews paginated', async t => {
  const html = await getProductReviewsHtml({ asin: 'B07JML91PY', pageNumber: 2 }, { useProxy: true })
  t.plan(2)
  t.true(typeof html === 'string')
  t.true(html.indexOf('B07JML91PY'))
})

test('gets reviews from product search', async t => {
  const reviews = await getProductReviews({ asin: 'B07JML91PY' }, { useProxy: true })
  t.plan(6)
  t.true(Array.isArray(reviews))
  t.true(reviews.length > 0)
  const review = reviews[0]
  t.true(review)
  t.true(review.stars > 0 && review.stars <= 5)
  t.true(review.dateString)
  t.true(review.text)
})

test('gets reviews from product search from page 2', async t => {
  const reviews = await getProductReviews({ asin: 'B07JML91PY', pageNumber: 2 }, { useProxy: true })
  t.plan(6)
  t.true(Array.isArray(reviews))
  t.true(reviews.length > 0)
  const review = reviews[0]
  t.true(review)
  t.true(review.stars > 0 && review.stars <= 5)
  t.true(review.dateString)
  t.true(review.text)
})

test('gets reviews from product search with proxy', async t => {
  const reviews = await getProductReviews({ asin: 'B07JML91PY' }, { useProxy: true })
  t.plan(6)
  t.true(Array.isArray(reviews))
  t.true(reviews.length > 0)
  const review = reviews[0]
  t.true(review)
  t.true(review.stars > 0 && review.stars <= 5)
  t.true(review.dateString)
  t.true(review.text)
})
