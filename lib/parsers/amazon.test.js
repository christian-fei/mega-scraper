const test = require('ava')
const fs = require('fs')
const path = require('path')

const { reviewsFromHtml } = require('./amazon')
const html = fs.readFileSync(path.resolve(__dirname, 'product-reviews-B07747FR44-1.html'), 'utf8')

test('parses review from html', async t => {
  const reviews = reviewsFromHtml(html)
  t.true(Array.isArray(reviews))
  t.true(reviews.length > 0)
  const review = reviews[0]
  t.truthy(review)
  t.true(review.stars >= 0 && review.stars <= 5)
  t.true(typeof review.dateString === 'string')
  t.true(typeof review.text === 'string')
})

test('parses reviews from html', async t => {
  const reviews = reviewsFromHtml(html)
  t.true(Array.isArray(reviews))
  t.true(reviews.length > 0)
})
