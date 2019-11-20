#!/usr/bin/env node

const debug = require('debug')
const { execSync } = require('child_process')
const EventEmitter = require('events')
const log = debug('mega-scraper:scrape')
debug.enable('mega-scraper:*')
const argv = require('yargs').coerce({
  headless: (v) => v !== 'false',
  proxy: (v) => v !== 'false',
  stylesheets: (v) => v !== 'false',
  javascript: (v) => v !== 'false',
  images: (v) => v !== 'false',
  timeout: (v) => Number.isFinite(v) ? v : undefined
}).parse()
const cache = require('./lib/storage/cache')
const getQueueId = require('./lib/get-queue-id')
const createQueue = require('./lib/create-queue')
const createBrowser = require('./lib/create-browser')
const createServer = require('./lib/create-server')
const scraperFor = require('./lib/scraper-for')

if (require.main === module) {
  log({ argv })
  scrape(argv._[0])
} else {
  module.exports = { scraperFor, getQueueId, createQueue, createBrowser, createServer, cache }
}

async function scrape (url) {
  log('version', require('./package.json').version)
  const scraper = await scraperFor(url)
  log(scraper)
  if (!scraper) throw new Error('unsupported url')
  log(`scraping ${url}`)

  const queueId = getQueueId(url)
  log(`queueId : bull:${queueId}`)
  const events = new EventEmitter()
  const queue = createQueue(queueId)
  const browser = await createBrowser(argv)

  log('starting scraping', url, argv)
  await scraper({ url, queue, events, browser })

  const statsCache = cache(`stats/${queueId}`)
  await initCache(statsCache, { url })
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
}

async function initCache (cache, { url } = {}) {
  cache.hset('start', +new Date())
  cache.hset('url', url)
  cache.hset('totalPages', 0)
  cache.hset('scrapedReviewsCount', 0)
  cache.hset('accuracy', 0)
  cache.hset('scrapedPages', 0)
  cache.hset('productReviewsCount', 0)
  cache.hset('pageSize', 0)
  cache.hset('totalPages', 0)
  cache.hset('elapsed', 0)
}
