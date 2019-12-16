const log = require('debug')('mega-scraper:set-stealth')

module.exports = async function setStealth (page, { url, timeout, stylesheets, javascript, images, cookie } = {}) {
  log('set stealth')
  await page.evaluateOnNewDocument(() => {
    try { Object.defineProperty(navigator, 'webdriver', { get: () => false }) } catch (err) { }
    try { Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] }) } catch (err) { }
    window.console.debug = () => { return null }
    window.navigator.chrome = { runtime: {} }
  })
}
