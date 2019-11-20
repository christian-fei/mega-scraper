const log = require('debug')('mega-scraper:scrapers:page')
const { normalizeUrl } = require('../url-logics/url')
const { saveHtmlFor } = require('../storage/scrape-cache')

module.exports = async function pageScraper ({ url, events, browser }) {
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

      events.emit('done', null)
    })
  } catch (err) {
    process.nextTick(() => {
      events.emit('done', err)
    })
  }

  return { events }
}
