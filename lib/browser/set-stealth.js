const log = require('debug')('mega-scraper:set-stealth')

module.exports = async function setStealth (page, { url, timeout, stylesheets, javascript, images, cookie } = {}) {
  log('set stealth')
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false })
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] })
    window.console.debug = () => { return null }
    window.navigator.chrome = { runtime: {} }
  })
}
