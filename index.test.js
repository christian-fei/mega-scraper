const tap = require('tap')
const got = require('got')
const $ = require('cheerio')

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
  t.true(reviews.length > 0)
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

async function fetchSearchHtml (search) {
  const response = await got(`https://www.amazon.it/s?k=${encodeURIComponent(search)}`)
  return response.body
}
async function fetchProductDetailsHtml (asin) {
  const response = await got(`https://www.amazon.it/dp/${asin}`)
  return response.body
}
async function fetchProductReviewsHtml (asin, pageNumber = 1) {
  const response = await got(`https://www.amazon.it/product-reviews/${asin}?pageNumber=${pageNumber}`)
  return response.body
}
function parseProductReviews (html) {
  return $('.review', html)
}
function extractReviewFromHtml (html) {
  const starsContent = $('[data-hook="review-star-rating"]', html)
  const dateString = $('[data-hook="review-date"]', html).text()
  const text = $('[data-hook="review-body"]', html).text()
  let stars
  if (!stars && starsContent.hasClass('a-star-5')) stars = 5
  if (!stars && starsContent.hasClass('a-star-4')) stars = 4
  if (!stars && starsContent.hasClass('a-star-3')) stars = 3
  if (!stars && starsContent.hasClass('a-star-2')) stars = 2
  if (!stars && starsContent.hasClass('a-star-1')) stars = 1

  return {
    stars,
    dateString,
    text
  }
}
