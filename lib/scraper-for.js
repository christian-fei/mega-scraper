const pageScraper = require('./scrapers/page')
const amazonItScraper = require('./scrapers/amazon.it')
const amazonComScraper = require('./scrapers/amazon.com')
const getHostname = require('./get-hostname')

module.exports = async function scraperFor (url) {
  const hostname = getHostname(url)
  const hostnameScrapers = {
    'amazon.it': amazonItScraper,
    'amazon.com': amazonComScraper
  }
  return hostnameScrapers[hostname] || pageScraper
}
