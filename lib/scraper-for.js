const log = require('debug')('mega-scraper:scraper-for')
const pageScraper = require('./scrapers/page')
const amazonGenericScraper = require('./scrapers/amazon.generic')
const amazonGenericClusterScraper = require('./scrapers/amazon.generic.cluster')
const { getHostname } = require('./url-logics/url')

module.exports = async function scraperFor (url, { cluster } = {}) {
  log('scraper for', url, cluster)
  const hostname = getHostname(url)
  if (hostname === 'amazon.it') return cluster ? amazonGenericClusterScraper : amazonGenericScraper
  if (hostname === 'amazon.com') return cluster ? amazonGenericClusterScraper : amazonGenericScraper
  return pageScraper
}
