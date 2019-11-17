#!/usr/bin/env node

const debug = require('debug')
const { execSync } = require('child_process')
const log = debug('mega-scraper:scrape')
debug.enable('mega-scraper:*')
// const argv = require('yargs').argv
const argv = require('yargs').coerce({
  headless: (v) => v === 'true',
  useProxy: (v) => v === 'true'
}).parse()
const cache = require('./lib/storage/cache')
const getQueueId = require('./lib/get-queue-id')
const createQueue = require('./lib/create-queue')
const createServer = require('./lib/create-server')
const scraperFor = require('./lib/scraper-for')

if (require.main === module) {
  log({ argv })
  scrape(argv._[0])
} else {
  module.exports = scrape
}

async function scrape (url) {
  log('version', require('./package.json').version)
  const scraper = await scraperFor(url)
  log(scraper)
  if (!scraper) throw new Error('unsupported url')
  log(`scraping ${url}`)

  const queueId = getQueueId(url)
  log(`queueId : bull:${queueId}`)
  const queue = createQueue(queueId)

  log('starting scraping', url, argv)
  const { events } = await scraper({ url, queue, ...argv })

  const statsCache = cache(`stats/${queueId}`)
  await initCache({ url })
  let stats = await statsCache.toJSON()

  const httpInstance = createServer()

  setTimeout(() => {
    execSync(`open http://localhost:4000`)
  }, 1000)

  events.on('done', (err) => { log('done', err); process.exit(err ? 1 : 0) })
  events.on('review', async (review) => {
    log('scraped review', review.hash, (review.text || '').substring(0, 80), review.dateString, '⭐️'.repeat(review.stars || 0))
    statsCache.hincrby('scrapedReviewsCount', 1)
    stats = await statsCache.toJSON()
    httpInstance.update(stats)
  })
  events.on('content', async (content) => {
    log('scraped content', (content || '').substring(0, 500))
    statsCache.hincrby('scrapedPages', 1)
  })

  process.on('unhandledRejection', (err) => log('unhandled rejection', err.message, err))
  process.on('uncaughtException', (err) => log('uncaught exception', err.message, err))

  setInterval(async () => {
    statsCache.hset('elapsed', Date.now() - +new Date(stats.start))
    stats = await statsCache.toJSON()
    httpInstance.update(stats)
  }, 500)

  async function initCache ({ url } = {}) {
    statsCache.hset('start', +new Date())
    statsCache.hset('url', url)
    statsCache.hset('totalPages', 0)
    statsCache.hset('scrapedReviewsCount', 0)
    statsCache.hset('accuracy', 0)
    statsCache.hset('scrapedPages', 0)
    statsCache.hset('productReviewsCount', 0)
    statsCache.hset('pageSize', 0)
    statsCache.hset('totalPages', 0)
    statsCache.hset('elapsed', 0)
  }
}
