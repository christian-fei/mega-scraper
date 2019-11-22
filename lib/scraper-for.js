const pageScraper = require('./scrapers/page')
const amazonGenericScraper = process.env.CLUSTER === 'true' ? require('./scrapers/amazon.generic.cluster') : require('./scrapers/amazon.generic')
const { getHostname } = require('./url-logics/url')

module.exports = async function scraperFor (url) {
  const hostname = getHostname(url)
  if (hostname === 'amazon.it') return amazonGenericScraper
  if (hostname === 'amazon.com') return amazonGenericScraper
  return pageScraper
}
