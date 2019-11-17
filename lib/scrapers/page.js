const log = require('debug')('mega-scraper:scrapers:page')
const createBrowser = require('../create-browser')
const normalizeUrl = require('../normalize-url')
const { saveHtmlFor } = require('../storage/scrape-cache')
const EventEmitter = require('events')

module.exports = async function pageScraper (url, queue) {
  const events = new EventEmitter()
  const browser = await createBrowser()
  log('scraping', url)
  let content = ''
  const page = await browser.newPage(url)

  try {
    content = await page.content()
    if (content && /captcha/gi.test(content)) {
      log('found captcha', url)
      throw new Error('captcha')
    }

    log(`saving html/${normalizeUrl(url)}.html`)
    try {
      saveHtmlFor(url, content)
    } catch (err) { console.error(err.message, err.stack) }

    await browser.instance.close()

    process.nextTick(() => {
      events.emit('content', content)

      events.emit('done', content)
    })
  } catch (err) {
    process.nextTick(() => {
      events.emit('done', err)
    })
  }

  return { events, queue }
}
