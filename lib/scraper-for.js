const pageScraper = require('./scrapers/page')
const amazonGenericScraper = require('./scrapers/amazon.generic')
// const amazonItScraper = require('./scrapers/amazon.it')
// const amazonComScraper = require('./scrapers/amazon.com')
const getHostname = require('./get-hostname')

module.exports = async function scraperFor (url) {
  const hostname = getHostname(url)
  if (hostname === 'amazon.it') return amazonGenericScraper
  if (hostname === 'amazon.com') return amazonGenericScraper
  return pageScraper
}
