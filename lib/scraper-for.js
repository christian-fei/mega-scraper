const pageScraper = require('./scrapers/page')
const amazonItScraper = require('./scrapers/amazon.it')
const amazonComScraper = require('./scrapers/amazon.com')
const getHostname = require('./get-hostname')

module.exports = async function scraperFor (url) {
  const hostname = getHostname(url)
  if (hostname === 'amazon.it') return amazonItScraper
  if (hostname === 'amazon.com') return amazonComScraper
  return pageScraper
}
