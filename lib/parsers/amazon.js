const cheerio = require('cheerio')
const log = require('debug')('mega-scraper:parser:amazon')
const { createHash } = require('crypto')

module.exports = {
  nextPageUrl,
  reviewsFromHtml,
  reviewFromHtml,
  hashify,
  dateFrom,
  textFrom,
  starsFrom
}

function nextPageUrl (html = '') {
  const $ = cheerio.load(html)
  const nextEl = $('[rel="next"]')
  if (!nextEl) return
  const url = nextEl.attr('href')
  log('nextPageUrl', url)
  return url
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

function reviewsFromHtml (html, mapFn = _ => _) {
  const reviews = cheerio('.review', html)
  const array = reviews.toArray()
    .map(reviewFromHtml)
    .filter(Boolean)
    .filter(r => r.text)
    .filter(r => r.stars)
    .filter(r => r.dateString)
    .map(mapFn)

  return array
}
function reviewFromHtml (html) {
  if (!html) return
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
  return review
}
function dateFrom (html) {
  const date = cheerio('[data-hook="review-date"]', html).text()
  return date
}
function textFrom (html) {
  const text = cheerio('[data-hook="review-body"]', html).text()
  return text
}
function starsFrom (html) {
  const starsContent = cheerio('[data-hook="review-star-rating"]', html)
  let stars
  if (starsContent.hasClass('a-star-5')) stars = 5
  if (starsContent.hasClass('a-star-4')) stars = 4
  if (starsContent.hasClass('a-star-3')) stars = 3
  if (starsContent.hasClass('a-star-2')) stars = 2
  if (starsContent.hasClass('a-star-1')) stars = 1
  return stars
}
