const $ = require('cheerio')
const log = require('debug')('parser:amazon')

module.exports = {
  parseProductReviews,
  reviewFromHtml
}

function parseProductReviews (html) {
  const reviews = $('.review', html)
  const array = reviews.toArray()
  return array
}
function reviewFromHtml (html) {
  return {
    stars: starsFrom(html),
    dateString: dateFrom(html),
    text: textFrom(html)
  }
}
function dateFrom (html) {
  return $('[data-hook="review-date"]', html).text()
}
function textFrom (html) {
  return $('[data-hook="review-body"]', html).text()
}
function starsFrom (html) {
  const starsContent = $('[data-hook="review-star-rating"]', html)
  /* istanbul ignore next */
  if (starsContent.hasClass('a-star-5')) return 5
  /* istanbul ignore next */
  if (starsContent.hasClass('a-star-4')) return 4
  /* istanbul ignore next */
  if (starsContent.hasClass('a-star-3')) return 3
  /* istanbul ignore next */
  if (starsContent.hasClass('a-star-2')) return 2
  /* istanbul ignore next */
  if (starsContent.hasClass('a-star-1')) return 1
}
