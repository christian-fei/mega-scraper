#!/usr/bin/env node

const log = require('debug')('sar:scrape')
const argv = require('yargs').argv
const getQueueId = require('lib/get-queue-id')
const createQueue = require('lib/create-queue')
const scraperFor = require('lib/scraper-for')

if (require.main === module) {
  scrape(argv._[0])
} else {
  module.exports = scrape
}

async function scrape (url) {
  log('version', require('./package.json').version)
  const scraper = await scraperFor(url)
  if (!scraper) throw new Error('unsupported url')
  log(`scraping ${url}`)

  const queueId = getQueueId(url)
  log(`queueId : bull:${queueId}`)
  const queue = createQueue(queueId)

  log('starting scraping', url)
  const { events } = await scraper(url).work(queue)

  events.on('done', (err) => { log('done', err); process.exit(err ? 1 : 0) })
  events.on('review', (review) => log('scraped review', review.hash, (review.text || '').substring(0, 80), review.dateString, '⭐️'.repeat(review.stars || 0)))
  events.on('content', (content) => log('scraped content', (content || '').substring(0, 500)))

  process.on('unhandledRejection', (err) => log('unhandled rejection', err.message, err))
  process.on('uncaughtException', (err) => log('uncaught exception', err.message, err))
}
