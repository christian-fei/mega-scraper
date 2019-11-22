const log = require('debug')('mega-scraper:get-puppeteer-options')

module.exports = function getPuppeteerOptions (options = {}) {
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--no-first-run',
    `--window-size=${options.width || 1280},${options.height || 800}`,
    '--window-position=0,0',
    '--ignore-certifcate-errors',
    '--ignore-certifcate-errors-skip-list',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--hide-scrollbars',
    '--disable-notifications'
  ]
  const puppeteerOptions = {
    args,
    ignoreHTTPSErrors: true
  }
  if (options.headless === true || options.headless === false || process.env.HEADLESS) {
    log('headless', options.headless)
    if (process.env.HEADLESS) options.headless = process.env.HEADLESS === 'true'
    Object.assign(puppeteerOptions, { headless: options.headless })
  }
  if (Number.isFinite(options.slowMo)) {
    log('slowMo', options.slowMo, 'ms')
    Object.assign(puppeteerOptions, { slowMo: options.slowMo })
  }

  return puppeteerOptions
}
