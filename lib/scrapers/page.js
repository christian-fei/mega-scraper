const log = require('debug')('mega-scraper:scrapers:page')
const createBrowser = require('../create-browser')
const normalizeUrl = require('../normalize-url')
const EventEmitter = require('events')
const fs = require('fs')
const path = require('path')

module.exports = function pageScraper (url) {
  return {
    async work (queue) {
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
          fs.writeFileSync(path.resolve(__dirname, '..', '..', 'html', `${normalizeUrl(url)}.html`), content, { encoding: 'utf8' })
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

      return { events }
    }
  }
}
