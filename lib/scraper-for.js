const log = require('debug')('mega-scraper:scraper-for')
const pageScraper = require('./scrapers/page')
const amazonQueueScraper = require('./scrapers/amazon.queue')
const { getHostname } = require('./url-logics/url')

module.exports = async function scraperFor (url, options = {}) {
  log('scraper for', url, options)
  const hostname = getHostname(url)
  if (hostname === 'amazon.it') return amazonQueueScraper
  if (hostname === 'amazon.com') return amazonQueueScraper
  return pageScraper
}
