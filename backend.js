#!/usr/bin/env node
const debug = require('debug')
debug.enable('mega-scraper:*')
const log = debug('mega-scraper:backend')
const amazonItScraper = require('./lib/scrapers/amazon.it')
const preparePage = require('./lib/browser/prepare-page')
const { createQueue } = require('./lib/queue')

const { Cluster } = require('puppeteer-cluster')

if (require.main === module) {
  createBackend()

  process.on('unhandledRejection', err => log(err.message, err))
  process.on('uncaughtException', err => log(err.message, err))
} else {
  module.exports = { createBackend }
}

async function createBackend () {
  log('createBackend')
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 4,
    monitor: true
  })
  cluster.on('queue', data => log('event "queue"', data))
  cluster.task(async ({ page, data: url }) => {
    await preparePage(page, { blocker: true, proxy: true })
    const scraper = scraperFor(url)
    if (!scraper) throw new Error('Unsupported')
    const result = await scraper({ url, page })
    return result
  })

  const queue = createQueue('scraper')
  queue.process(async (job, done) => {
    log('received job', job.id, 'url', job.data && job.data.url, 'data', job.data)
    if (!job.data.url) throw new Error('Missing url')
    await cluster.queue(job.data.url)
    done()
  })

  // await cluster.idle()
  // await cluster.close()

  return cluster
}

function scraperFor (url) {
  if (url.includes('amazon.it')) return amazonItScraper
}
