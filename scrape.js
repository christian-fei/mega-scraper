#!/usr/bin/env node

const log = require('debug')('sar:scrape')
const argv = require('yargs').argv
const getQueueId = require('./lib/get-queue-id')
const createQueue = require('./lib/create-queue')
const scraperFor = require('./lib/scraper-for')

if (require.main === module) {
  scrape(argv._[0])
} else {
  module.exports = scrape
}

async function scrape (url) {
  log({ url })
  const scraper = await scraperFor(url)
  if (!scraper) throw new Error('unsupported url')

  const queueId = getQueueId(url)
  log(`queueId : bull:${queueId}`)
  const queue = createQueue(queueId)
  queue.clean(0, 'wait')
  queue.clean(0, 'active')
  queue.clean(0, 'delayed')
  queue.clean(0, 'failed')

  log('starting scraping', url)
  const { events } = await scraper(url).work(queue)

  log('listening on "done" event', url)
  events.on('done', () => {
    log('done')
    process.exit(0)
  })
  log('listening on "review" event', url)
  events.on('review', (review) => {
    log('scraped review', review)
  })
  log('listening on "content" event', url)
  events.on('content', (content) => {
    log('scraped content', (content || '').substring(0, 500))
  })

  process.on('unhandledRejection', (err) => {
    log('unhandled rejection', err.message, err)
  })

  process.on('uncaughtException', (err) => {
    log('uncaught exception', err.message, err)
  })
}
