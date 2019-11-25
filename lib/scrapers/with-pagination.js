const log = require('debug')('mega-scraper:scrapers:with-pagination')

module.exports = async function withPagination ({ url, toPage, queue, events, browser, getUrls }) {
  log('with pagination')
  const page = await browser.newPage()
  const pages = await getUrls({ url, page })
  log('pages', pages.length)
  return { queue, events, browser }
}
