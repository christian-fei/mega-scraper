const log = require('debug')('mega-scraper:create-browser')
const puppeteer = require('puppeteer')
// const pluginStealth = require('puppeteer-extra-plugin-stealth')
// puppeteer.use(pluginStealth())
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
    async newPage (url, { reusePage = false } = {}) {
      const pages = await instance.pages()
      let page = (pages.length > 0 && reusePage) ? pages[0] : await instance.newPage()
      page = await preparePage(page, options)

      if (options.proxy && options.proxy.username && options.proxy.password) {
        await page.authenticate({
          username: options.proxy.username,
          password: options.proxy.password
        })
      }

      if (url) {
        const gotoOptions = { timeout: options.timeout || 60000 }
        await page.goto(url, gotoOptions)
      }

      return page
    },
    close: () => instance.close(),
    instance
  }
}
