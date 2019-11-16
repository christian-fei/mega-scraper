const log = require('debug')('sar:browser')
const puppeteer = require('puppeteer')
const UA = require('user-agents')
const getFreeHttpsProxy = require('get-free-https-proxy')

module.exports = async function browser (options = { useProxy: process.env.USE_PROXY !== 'false', headless: false, width: 1280, height: 800 }) {
  const args = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-infobars', '--no-first-run', `--window-size=${options.width},${options.height}`]
  if (options.useProxy) {
    const proxies = await getFreeHttpsProxy()
    const index = parseInt(Math.random() * proxies.length, 10)
    const proxy = proxies[index]

    log('using proxy', proxy, index)
    args.push(`--proxy-server=${proxy.host}:${proxy.port}`)
  }

  const browserOptions = { args, ignoreHTTPSErrors: true }
  if (options.headless === true || options.headless === false) {
    log('headless', options.headless)
    Object.assign(browserOptions, { headless: options.headless })
  }
  if (Number.isFinite(options.slowMo)) {
    log('slowMo', options.slowMo, 'ms')
    Object.assign(browserOptions, { slowMo: options.slowMo })
  }

  const instance = await puppeteer.launch(browserOptions)

  log('new browser', options)
  return {
    async newPage (url) {
      const pages = await instance.pages()
      const page = (pages.length > 0) ? pages[0] : await instance.newPage()
      const userAgent = randomUA()
      log('userAgent', userAgent)
      await page.setUserAgent(userAgent)
      await page.setViewport({ width: options.width, height: options.height })
      if (url) await page.goto(url)
      return page
    },
    instance
  }
}

function randomUA () {
  return new UA({ deviceCategory: 'desktop' }).toString()
}
