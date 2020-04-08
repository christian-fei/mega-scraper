const log = require('debug')('mega-scraper:create-browser')
const puppeteer = require('puppeteer')
const getFreeHttpsProxy = require('get-free-https-proxy')
const getPuppeteerOptions = require('./get-puppeteer-options')
const preparePage = require('./prepare-page')

module.exports = async function createBrowser (options = {
  proxy: true,
  stylesheets: true,
  javascript: true,
  incognito: true,
  headless: true,
  images: true,
  cookie: undefined,
  width: 1280,
  height: 800,
  slowMo: undefined,
  userAgent: undefined,
  timeout: 60000
}) {
  if (typeof options.proxy === 'boolean' && options.proxy === true) {
    const proxies = await getFreeHttpsProxy()
    const { host, port } = proxies[Math.max(0, parseInt(proxies.length * Math.random()) - 1)]
    Object.assign(options, { proxy: `${host}:${port}` })
  }

  const puppeteerOptions = getPuppeteerOptions(options)
  log('puppeteerOptions', puppeteerOptions)
  let instance
  if (!puppeteerOptions.browserWSEndpoint) {
    instance = await puppeteer.launch(puppeteerOptions)
  } else {
    instance = await puppeteer.connect(puppeteerOptions)
  }

  log('new browser', options, puppeteerOptions)
  return {
    async newPage (url, { reusePage = true } = {}) {
      const pages = await instance.pages()
      const page = (pages.length > 0 && reusePage) ? pages[0] : await instance.newPage()

      page.on('dialog', async dialog => {
        log(`dismissing dialog`)
        await dialog.dismiss()
      })

      if (typeof options.proxy === 'object' && options.proxy.username && options.proxy.password) {
        log('authenticating to proxy', options.proxy)
        await page.authenticate({
          username: options.proxy.username,
          password: options.proxy.password
        })
      }

      if (url && typeof url === 'string') {
        const gotoOptions = { timeout: options.timeout || 60000 }
        await page.goto(url, gotoOptions)
      }

      await preparePage(page, options)

      return page
    },
    close: () => instance.close(),
    instance
  }
}
