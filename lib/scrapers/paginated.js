const log = require('debug')('mega-scraper:scrapers:paginated')

module.exports = async function paginated ({ queue, events, browser, url, processFn }) {
  if (!url) throw new Error('missing url')
  const page = await browser.newPage()
  queue.process(processFn({ queue, events, page, browser }))

  queue.add({ url }, { attempts: 3, timeout: 5000 })

  queue.on('drained', async function () {
    log('-- queue drained')
    await browser.instance.close()
    events.emit('done')
  })
  queue.on('active', () => log('-- queue active'))
  queue.on('completed', () => log('-- queue completed'))

  return { queue, events }
}
