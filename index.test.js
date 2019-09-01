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
  const html = await fetchProductDetailsHtml('B07VF7YVX4')
  t.plan(1)
  t.true(html.indexOf('B07VF7YVX4'))
})

tap.test('get product reviews', async t => {
  const html = await fetchProductReviewsHtml('B07VF7YVX4')
  t.plan(1)
  t.true(html.indexOf('B07VF7YVX4'))
})

tap.test('get product reviews paginated', async t => {
  const html = await fetchProductReviewsHtml('B07VF7YVX4', 2)
  t.plan(1)
  t.true(html.indexOf('B07VF7YVX4'))
})

tap.test('parses product reviews paginated', async t => {
  const html = await fetchProductReviewsHtml('B07VF7YVX4')
  const reviews = parseProductReviews(html)
  t.plan(1)
  t.true(reviews)
})

tap.test('extracts review from html', async t => {
  const html = await fetchProductReviewsHtml('B07VF7YVX4')
  const reviews = parseProductReviews(html)
  const review = extractReviewFromHtml(reviews[0])
  t.plan(4)
  t.true(review)
  t.true(review.stars > 0 && review.stars <= 5)
  t.true(review.dateString)
  t.true(review.text)
})

tap.test('gets reviews from product search', async t => {
  const reviews = await getProductReviews('porta carta credito')
  const review = reviews[0]
  t.plan(4)
  t.true(review)
  t.true(review.stars > 0 && review.stars <= 5)
  t.true(review.dateString)
  t.true(review.text)
})
