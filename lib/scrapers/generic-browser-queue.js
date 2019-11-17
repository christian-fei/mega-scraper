const log = require('debug')('sar:scrapers:generic-queue')
const createBrowser = require('../create-browser')
const EventEmitter = require('events')

module.exports = async function genericQueue (queue) {
  const events = new EventEmitter()
  const browser = await createBrowser()

  queue.on('drained', async function () {
    log('-- queue drained')
    browser && await browser.instance.close()
    events.emit('done')
  })
  queue.on('active', function () {
    log('-- queue active')
  })
  queue.on('completed', function () {
    log('-- queue completed')
  })

  return { queue, browser, events }
}
