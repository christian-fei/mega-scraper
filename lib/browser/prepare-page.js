const log = require('debug')('mega-scraper:prepare-page')
const setProxy = require('./set-proxy')
const setBlocker = require('./set-blocker')
const setStealth = require('./set-stealth')
const randomUA = require('../util/random-ua')

module.exports = async function preparePage (page, options = {}) {
  log('customized page', options)
  const userAgent = randomUA()
  log('userAgent', userAgent)
  await page.setUserAgent(userAgent)
  await page.setViewport({ width: options.width || 1280, height: options.height || 800 })

  if (options.proxy) await setProxy(page, options)
  if (options.blocker) await setBlocker(page, options)
  await setStealth(page)
  return page
}
