const log = require('debug')('mega-scraper:scrapers:paginated')

module.exports = async function paginated ({ queue, events, browser, url, processFn }) {
  if (!url) throw new Error('missing url')

  queue.process(processFn)

  queue.add({ url }, { attempts: 3, timeout: 5000 })

  queue.on('drained', async function () {
    log('-- queue drained')
    events.emit('done')
    await browser.instance.close()
  })
  queue.on('active', () => log('-- queue active'))
  queue.on('completed', () => log('-- queue completed'))

  return { queue, events }
}
