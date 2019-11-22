const log = require('debug')('mega-scraper:browser')
const puppeteer = require('puppeteer')
// const pluginStealth = require('puppeteer-extra-plugin-stealth')
// puppeteer.use(pluginStealth())
const got = require('got')
const randomUA = require('./util/random-ua')
const getFreeHttpsProxy = require('get-free-https-proxy')

module.exports = async function browser ({
  proxy,
  headless,
  stylesheets,
  javascript,
  images,
  blocker,
  cookie,
  width = 1280,
  height = 800,
  slowMo,
  timeout
} = { }) {
  const args = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--no-first-run',
    `--window-size=${width || 1280},${height || 800}`,
    '--window-position=0,0',
    '--ignore-certifcate-errors',
    '--ignore-certifcate-errors-skip-list',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--hide-scrollbars',
    '--disable-notifications'
  ]

  const browserOptions = { args, ignoreHTTPSErrors: true }
  if (headless === true || headless === false || process.env.HEADLESS) {
    log('headless', headless)
    if (process.env.HEADLESS) headless = process.env.HEADLESS === 'true'
    Object.assign(browserOptions, { headless: headless })
  }
  if (Number.isFinite(slowMo)) {
    log('slowMo', slowMo, 'ms')
    Object.assign(browserOptions, { slowMo: slowMo })
  }

  const instance = await puppeteer.launch(browserOptions)

  log('new browser', { proxy, headless, width, height, slowMo, timeout, cookie }, args)
  return {
    async newPage (url) {
      const pages = await instance.pages()
      const page = (pages.length > 0) ? pages[0] : await instance.newPage()
      const userAgent = randomUA()
      log('userAgent', userAgent)
      await page.setUserAgent(userAgent)
      await page.setViewport({ width: width || 1280, height: height || 800 })
      if (proxy) await setProxy(page, { url, stylesheets, javascript, images, cookie })
      if (blocker) await setBlocker(page, { url, stylesheets, javascript, images })
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false })
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] })
        window.console.debug = () => { return null }
        window.navigator.chrome = { runtime: {} }
      })

      if (url) await page.goto(url, { timeout, waitUntil: 'networkidle2' })

      return page
    },
    instance
  }
}

async function setBlocker (page, { url, timeout, stylesheets, javascript, images } = {}) {
  log('using blocker', url)
  try { await page.setRequestInterception(true) } catch (err) { log(err.message) }
  const blockedResourceTypes = [
    'font',
    'ws',
    'texttrack',
    'object',
    'beacon',
    'csp_report'
  ]
  const skippedResources = [
    'quantserve',
    'adzerk',
    'doubleclick',
    'adition',
    'exelator',
    'sharethrough',
    'cdn.api.twitter',
    'google-analytics',
    'googletagmanager',
    'google',
    'fontawesome',
    'facebook',
    'analytics',
    'optimizely',
    'clicktale',
    'mixpanel',
    'zedo',
    'clicksor',
    'tiqcdn',
    'amazon-adsystem',
    'adnxs.com',
    'contextweb.com',
    'lijit.com'
  ]
  if (!stylesheets && process.env.STYLESHEETS !== 'true') {
    log('blocking stylesheets')
    blockedResourceTypes.push('stylesheet')
  }
  if (!javascript && process.env.JAVASCRIPT !== 'true') {
    log('blocking javascript')
    blockedResourceTypes.push('javascript')
  }
  if (!images && process.env.IMAGES !== 'true') {
    log('blocking images')
    blockedResourceTypes.push('image')
    blockedResourceTypes.push('media')
    blockedResourceTypes.push('imageset')
  }
  const skippedMatches = [
    /amazon\.\w+\/1/,
    /amazon\.\w+\/cem/
  ]

  page.on('request', async (interceptedRequest) => {
    const requestUrl = interceptedRequest._url.split('?')[0].split('#')[0]
    if (
      blockedResourceTypes.includes(interceptedRequest.resourceType()) ||
      skippedResources.some(resource => requestUrl.includes(resource)) ||
      skippedMatches.some(m => m.test(requestUrl))
    ) {
      // log('blocking', requestUrl)
      return interceptedRequest.abort().catch(Function.prototype)
    }
    // log('pass', requestUrl)

    return interceptedRequest.continue().catch(Function.prototype)
  })
}

async function setProxy (page, { url, timeout, stylesheets, javascript, images, cookie } = {}) {
  log('using proxy', url)
  let proxies = await getFreeHttpsProxy()
  try { await page.setRequestInterception(true) } catch (err) { log(err.message) }

  page.on('request', async (interceptedRequest) => {
    const requestUrl = interceptedRequest._url.split('?')[0].split('#')[0]
    const index = Math.min(proxies.length, parseInt(Math.random() * proxies.length, 10))
    const proxy = proxies[index]

    if (!proxy) return interceptedRequest.continue().catch(Function.prototype)
    log('using proxy', requestUrl, proxy, index)

    await got({
      url: interceptedRequest.url(),
      method: interceptedRequest.method(),
      headers: Object.assign({}, interceptedRequest.headers(), cookie ? { cookie } : {}),
      body: interceptedRequest.postData(),
      proxy: `https://${proxy.host}:${proxy.port}`,
      timeout
    })
      .then(response => interceptedRequest.respond({
        status: response.statusCode,
        contentType: response.headers['content-type'],
        headers: response.headers,
        body: response.body
      }))
      .catch(async (_) => {
        proxies = proxies.filter((_, i) => i !== index)
        if (proxies.length === 0) {
          proxies = await getFreeHttpsProxy()
        }
      })

    await interceptedRequest.continue().catch(Function.prototype)
  })
}
