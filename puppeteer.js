const puppeteer = require('puppeteer')
const path = require('path')
const log = require('debug')('sar:puppeteer')
const getFreeHttpsProxy = require('get-free-https-proxy')
const UA = require('user-agents')

module.exports = get

async function get ({ url, asin, headers = {}, useProxy = false || process.env.USE_PROXY === 'TRUE' }) {
  const args = ['--no-sandbox', '--disable-setuid-sandbox', '--no-first-run']
  const browserOptions = {
    args
  }

  if (process.env.NO_HEADLESS) {
    log('headless option false')
    Object.assign(browserOptions, { headless: false })
  }
  if (process.env.SLOW_DOWN) {
    log('slow down option 250ms')
    Object.assign(browserOptions, { slowMo: 250 }) // https://github.com/GoogleChrome/puppeteer#debugging-tips
  }

  if (useProxy) {
    const proxies = await getFreeHttpsProxy()
    const index = parseInt(Math.random() * proxies.length, 10)
    const proxy = proxies[index]

    log('using proxy', proxy, index)
    args.push(`--proxy-server=${proxy.host}:${proxy.port}`)
  }

  const browser = await puppeteer.launch(browserOptions)

  let page
  const pages = await browser.pages()
  if (pages && pages.length > 0) {
    page = pages[0]
  } else {
    page = await browser.newPage()
  }
  await page.setUserAgent(randomUA())
  await page.goto(url)

  const body = await page.content()

  const normalizedUrl = url.replace(/\//gi, '|')
  const screenshotPath = path.resolve(__dirname, `screenshots/${asin ? 'asin/' : ''}${normalizedUrl}.png`)
  log('taking screenshot', url, screenshotPath)
  try {
    await page.screenshot({ path: screenshotPath, fullPage: true })
    log('took screenshot', url, screenshotPath)
  } catch (err) {
    log(`failed to snapshot ${err.message}`, url, screenshotPath, err)
  }

  try {
    await page.close()
    await browser.close()
  } catch (err) {
    log(`failed to close puppeteer ${err.message}`, url, screenshotPath, werr)
  }

  return { body, screenshotPath }
}

function randomUA () {
  return new UA().toString()
}
