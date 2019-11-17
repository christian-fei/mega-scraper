#!/usr/bin/env node

const debug = require('debug')
const log = debug('mega-scraper:scrape')
debug.enable('mega-scraper:*')
const argv = require('yargs').argv
const cache = require('./lib/storage/cache')
const getQueueId = require('./lib/get-queue-id')
const createQueue = require('./lib/create-queue')
const createServer = require('./lib/create-server')
const scraperFor = require('./lib/scraper-for')

if (require.main === module) {
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

  log('starting scraping', url)
  const { events } = await scraper({ url, queue, ...argv })

  const statsCache = cache(`stats/${queueId}`)
  await initCache({ url })
  const httpInstance = createServer()
  let stats = await statsCache.toJSON()

  events.on('done', (err) => { log('done', err); process.exit(err ? 1 : 0) })
  events.on('review', async (review) => {
    log('scraped review', review.hash, (review.text || '').substring(0, 80), review.dateString, '⭐️'.repeat(review.stars || 0))
    await statsCache.hincrby('scrapedReviewsCount', 1)
    stats = await statsCache.toJSON()
    httpInstance.update(stats)
  })
  events.on('content', (content) => log('scraped content', (content || '').substring(0, 500)))

  process.on('unhandledRejection', (err) => log('unhandled rejection', err.message, err))
  process.on('uncaughtException', (err) => log('uncaught exception', err.message, err))

  const httpInstanceUpdateHandle = setInterval(async () => {
    if (stats.scrapedPages >= stats.totalPages) {
      log(`finished: ${stats.scrapedPages} / ${stats.totalPages}`)
      clearInterval(httpInstanceUpdateHandle)
      return
    }
    statsCache.hset('elapsed', Date.now() - +new Date(stats.start))
    stats = await statsCache.toJSON()
    httpInstance.update(stats)
  }, 500)

  async function initCache ({ url } = {}) {
    await statsCache.hset('start', +new Date())
    await statsCache.hset('url', url)
    await statsCache.hset('totalPages', 0)
    await statsCache.hset('scrapedReviewsCount', 0)
    await statsCache.hset('accuracy', 0)
    await statsCache.hset('scrapedPages', 0)
    await statsCache.hset('productReviewsCount', 0)
    await statsCache.hset('pageSize', 0)
    await statsCache.hset('totalPages', 0)
    await statsCache.hset('elapsed', 0)
  }
}
