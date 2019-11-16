#!/usr/bin/env node

const log = require('debug')('sar:scrape')
const argv = require('yargs').argv
const getHostname = require('./lib/get-hostname')
const getQueueId = require('./lib/get-queue-id')
const createQueue = require('./lib/create-queue')
const pageScraper = require('./lib/scrapers/page')
const amazonItScraper = require('./lib/scrapers/amazon.it')

const scraperFor = {
  'www.amazon.it': amazonItScraper
}

if (require.main === module) {
  scrape(argv._[0])
} else {
  module.exports = scrape
}

async function scrape (url) {
  const hostname = getHostname(url)
  log({ url, hostname })
  const scraper = scraperFor[hostname] || pageScraper
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

  events.on('done', () => {
    console.log('done')
    process.exit(0)
  })
  events.on('review', (review) => {
    console.log('new review', review)
  })
  events.on('content', (content) => {
    console.log('new content', (content || '').substring(0, 500))
  })
}

process.on('unhandledRejection', (err) => {
  log('unhandled rejection', err.message, err)
})

process.on('uncaughtException', (err) => {
  log('uncaught exception', err.message, err)
})
