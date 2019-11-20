const pageScraper = require('./scrapers/page')
const amazonGenericScraper = require('./scrapers/amazon.generic')
const { getHostname } = require('./logics/url')

module.exports = async function scraperFor (url) {
  const hostname = getHostname(url)
  if (hostname === 'amazon.it') return amazonGenericScraper
  if (hostname === 'amazon.com') return amazonGenericScraper
  return pageScraper
}
