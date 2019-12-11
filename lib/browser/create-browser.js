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
  headless: true,
  images: true,
  blocker: true,
  cookie: undefined,
  width: 1280,
  height: 800,
  slowMo: undefined,
  timeout: 5000
}) {
  const puppeteerOptions = getPuppeteerOptions(options)
  const instance = await puppeteer.launch(puppeteerOptions)

  log('new browser', options, puppeteerOptions)
  return {
    async newPage (url, { reusePage = true } = {}) {
      const pages = await instance.pages()
      let page = (pages.length > 0 && reusePage) ? pages[0] : await instance.newPage()
      page = await preparePage(page, options)

      if (url) await page.goto(url, { timeout: options.timeout, waitUntil: 'networkidle2' })

      return page
    },
    instance
  }
}
