const got = require('got')
const $ = require('cheerio')

module.exports = {
  fetchSearchHtml,
  fetchProductDetailsHtml,
  fetchProductReviewsHtml,
  parseProductReviews,
  extractReviewFromHtml
}

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
