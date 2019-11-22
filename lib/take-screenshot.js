const log = require('debug')('mega-scraper:take-screenshot')
const { extractAsin, extractPage } = require('./url-logics/amazon')
const fs = require('fs')
const { screenshotDirFor, screenshotPathFor } = require('./storage/scrape-cache')

module.exports = async function (page, { url }) {
  const asin = extractAsin(url)
  const pageNumber = extractPage(url)
  const screenshotPath = screenshotPathFor(url)
  log('screenshot', { url, asin, pageNumber, path: screenshotPath })

  fs.mkdirSync(screenshotDirFor(url), { recursive: true })
  await page.screenshot({ path: screenshotPath, type: 'png' }).catch(log)
  return screenshotPath
}
