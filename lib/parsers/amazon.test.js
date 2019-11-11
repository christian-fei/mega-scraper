const { test } = require('tap')

const {
  parseProductReviews,
  reviewFromHtml
} = require('./amazon')

const {
  productReviews
} = require('../scrapers/amazon')

test('parses product reviews paginated', async t => {
  const { body: html } = await productReviews({ asin: 'B07747FR44', pageNumber: 1 })
  const reviews = parseProductReviews(html)
  t.plan(2)
  t.true(Array.isArray(reviews))
  t.true(reviews.length > 0)
})

test('extracts review from html', async t => {
  const { body: html } = await productReviews({ asin: 'B07747FR44', pageNumber: 1 })
  t.plan(6)
  const reviews = parseProductReviews(html)
  t.true(Array.isArray(reviews))
  t.true(reviews.length > 0)
  const review = reviewFromHtml(reviews[0])
  t.true(review)
  t.true(review.stars > 0 && review.stars <= 5)
  t.true(review.dateString)
  t.true(review.text)
})
