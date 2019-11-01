const tap = require('tap')

const {
  fetchSearchHtml,
  fetchProductDetailsHtml,
  fetchProductReviewsHtml,
  getProductReviews,
  parseProductReviews,
  extractReviewFromHtml
} = require('.')

tap.test('get page html content', async t => {
  const html = await fetchSearchHtml('porta carta credito')
  t.plan(1)
  t.true(html.indexOf('s-search-results'))
})

tap.test('get product details', async t => {
  const html = await fetchProductDetailsHtml('B07JML91PY')
  t.plan(1)
  t.true(html.indexOf('B07JML91PY'))
})

tap.test('get product reviews', async t => {
  const html = await fetchProductReviewsHtml('B07JML91PY')
  t.plan(1)
  t.true(html.indexOf('B07JML91PY'))
})

tap.test('get product reviews paginated', async t => {
  const html = await fetchProductReviewsHtml('B07JML91PY', 2)
  t.plan(1)
  t.true(html.indexOf('B07JML91PY'))
})

tap.test('parses product reviews paginated', async t => {
  const html = await fetchProductReviewsHtml('B07JML91PY')
  const reviews = parseProductReviews(html)
  t.plan(1)
  t.true(reviews)
})

tap.test('extracts review from html', async t => {
  const html = await fetchProductReviewsHtml('B07JML91PY')
  const reviews = parseProductReviews(html)
  const review = extractReviewFromHtml(reviews[0])
  t.plan(4)
  t.true(review)
  t.true(review.stars > 0 && review.stars <= 5)
  t.true(review.dateString)
  t.true(review.text)
})

tap.test('gets reviews from product search', async t => {
  const reviews = await getProductReviews('B07JML91PY')
  const review = reviews[0]
  t.plan(4)
  t.true(review)
  t.true(review.stars > 0 && review.stars <= 5)
  t.true(review.dateString)
  t.true(review.text)
})

tap.test('gets reviews from product search with proxy', async t => {
  const reviews = await getProductReviews('B07JML91PY', 1, { useProxy: true })
  const review = reviews[0]
  t.plan(4)
  t.true(review)
  t.true(review.stars > 0 && review.stars <= 5)
  t.true(review.dateString)
  t.true(review.text)
})
