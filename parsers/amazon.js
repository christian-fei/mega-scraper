const $ = require('cheerio')
const log = require('debug')('parser:amazon')
const { createHash } = require('crypto')

module.exports = {
  parseProductReviews,
  reviewFromHtml
}

function hashify (text, nChars = 50) {
  const hash = createHash('md5')

  if (nChars) {
    hash.update(text.substring(0, nChars), 'utf8')
  } else {
    hash.update(text, 'utf8')
  }

  return hash.digest('hex')
}

function parseProductReviews (html) {
  const reviews = $('.review', html)
  const array = reviews.toArray()
  return array
}
function reviewFromHtml (html) {
  const text = textFrom(html)
  const hash = hashify(text)
  const stars = starsFrom(html)
  const dateString = dateFrom(html)
  const review = {
    hash,
    stars,
    dateString,
    text
  }
  log('reviewFromHtml', review)
  return review
}
function dateFrom (html) {
  const date = $('[data-hook="review-date"]', html).text()
  log('dateFrom', date)
  return date
}
function textFrom (html) {
  const text = $('[data-hook="review-body"]', html).text()
  log('textFrom', text)
  return text
}
function starsFrom (html) {
  const starsContent = $('[data-hook="review-star-rating"]', html)
  let stars
  /* istanbul ignore next */
  if (starsContent.hasClass('a-star-5')) stars = 5
  /* istanbul ignore next */
  if (starsContent.hasClass('a-star-4')) stars = 4
  /* istanbul ignore next */
  if (starsContent.hasClass('a-star-3')) stars = 3
  /* istanbul ignore next */
  if (starsContent.hasClass('a-star-2')) stars = 2
  /* istanbul ignore next */
  if (starsContent.hasClass('a-star-1')) stars = 1
  log('starsFrom', stars)
  return stars
}
