const log = require('debug')('mega-scraper:take-screenshot')
const fs = require('fs')
const { screenshotDirFor, screenshotPathFor } = require('../storage/scrape-cache')

module.exports = async function takeScreenshot (page, { url }) {
  const screenshotPath = screenshotPathFor(url)
  log('screenshot', { url, path: screenshotPath })

  fs.mkdirSync(screenshotDirFor(url), { recursive: true })
  await page.screenshot({ path: screenshotPath, type: 'png', fullPage: true }).catch(log)
  return screenshotPath
}
