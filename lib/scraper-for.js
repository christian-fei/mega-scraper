const log = require('debug')('mega-scraper:scraper-for')
const pageScraper = require('./scrapers/page')
const amazonQueueScraper = require('./scrapers/amazon.queue')
const amazonGenericClusterScraper = require('./scrapers/amazon.cluster')
const { getHostname } = require('./url-logics/url')

module.exports = async function scraperFor (url, { cluster } = {}) {
  log('scraper for', url, cluster)
  const hostname = getHostname(url)
  if (hostname === 'amazon.it') return cluster ? amazonGenericClusterScraper : amazonQueueScraper
  if (hostname === 'amazon.com') return cluster ? amazonGenericClusterScraper : amazonQueueScraper
  return pageScraper
}
