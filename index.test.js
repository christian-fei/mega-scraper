const { test } = require('tap')

const {
  fetchSearchHtml,
  fetchProductDetailsHtml,
  fetchProductReviewsHtml,
  getProductReviews,
  parseProductReviews,
  extractReviewFromHtml
} = require('.')

test('get page html content', async t => {
  const html = await fetchSearchHtml('porta carta credito')
  t.plan(2)
  t.true(typeof html === 'string')
  t.true(html.indexOf('s-search-results'))
})

test('get product details', async t => {
  const html = await fetchProductDetailsHtml('B07JML91PY')
  t.plan(2)
  t.true(typeof html === 'string')
  t.true(html.indexOf('B07JML91PY'))
})

test('get product reviews', async t => {
  const html = await fetchProductReviewsHtml('B07JML91PY')
  t.plan(2)
  t.true(typeof html === 'string')
  t.true(html.indexOf('B07JML91PY'))
})

test('get product reviews paginated', async t => {
  const html = await fetchProductReviewsHtml('B07JML91PY', 2)
  t.plan(2)
  t.true(typeof html === 'string')
  t.true(html.indexOf('B07JML91PY'))
})

test('parses product reviews paginated', async t => {
  const html = await fetchProductReviewsHtml('B07JML91PY')
  const reviews = parseProductReviews(html)
  t.plan(2)
  t.true(Array.isArray(reviews))
  t.true(reviews.length > 0)
})

test('extracts review from html', async t => {
  const html = await fetchProductReviewsHtml('B07JML91PY')
  t.plan(6)
  const reviews = parseProductReviews(html)
  t.true(Array.isArray(reviews))
  t.true(reviews.length > 0)
  const review = extractReviewFromHtml(reviews[0])
  t.true(review)
  t.true(review.stars > 0 && review.stars <= 5)
  t.true(review.dateString)
  t.true(review.text)
})

test('gets reviews from product search', async t => {
  const reviews = await getProductReviews({ asin: 'B07JML91PY' })
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
  const reviews = await getProductReviews({ asin: 'B07JML91PY', pageNumber: 2 })
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
