#!/usr/bin/env node
const debug = require('debug')
const log = debug('mega-scraper:scrape')
const EventEmitter = require('events')
const { execSync } = require('child_process')
const { cache, createQueue, getQueueName, createBrowser, createServer, scraperFor, options, initStatsCache } = require('./')

scrape(options._[0], options)

async function scrape (url, options = {}) {
  !process.env.DEBUG && debug.enable('mega-scraper:scrape')
  log('version', require('./package.json').version, 'options', JSON.stringify(options))
  const scraper = await scraperFor(url, options)
  log({ scraper })
  if (!scraper) throw new Error('unsupported url')
  log(`scraping ${url}`)

  const httpInstance = await createServer()
  const address = await httpInstance.address()
  try { log(`opening ${address}`); execSync(`open ${address}`) } catch (err) { log(err.message) }

  const events = new EventEmitter()
  const queueName = getQueueName(url)
  const queue = createQueue(queueName)
  const browser = await createBrowser(options)
  const statsCacheName = `stats/${queueName}`
  const statsCache = cache(statsCacheName)
  await initStatsCache(statsCache, { url, ...options })
  let stats = await statsCache.toJSON()
  log(`created stats ${statsCacheName} ${JSON.stringify(stats, null, 2)}`)

  scraper({ url, queue, events, browser, ...options })

  events.on('nextUrl', async nextUrl => {
    log({ nextUrl })
    if (nextUrl) await queue.add({ url: nextUrl }, { priority: 1 })
  })

  const updateIntervalHandle = setInterval(async () => {
    await statsCache.hset('elapsed', Date.now() - +new Date(stats.start))
    stats = await statsCache.toJSON()
    httpInstance.update(stats)
  }, 250)
  const updateLogIntervalHandle = setInterval(async () => {
    stats = await statsCache.toJSON()
    delete stats.lastTenScrapedReviews
    log({ stats })
  }, 3000)

  events.on('done', async (err, result) => {
    log('done', err, result)
    await statsCache.hset('finish', +new Date())
    clearInterval(updateIntervalHandle)
    clearInterval(updateLogIntervalHandle)
    await browser.instance.close()
    stats = await statsCache.toJSON()
    httpInstance.update(stats)
    setTimeout(() => {
      options.exit && process.exit(err ? 1 : 0)
    }, 5000)
  })
  events.on('review', async (review) => {
    log('scraped review', review.hash, (review.text || '').substring(0, 80), review.dateString, '⭐️'.repeat(review.stars || 0))
    await statsCache.hincrby('scrapedReviewsCount', 1)
    let scrapedReviews = await statsCache.hget('lastTenScrapedReviews') || '[]'
    try { scrapedReviews = JSON.parse(scrapedReviews) } catch (err) { scrapedReviews = [] }
    scrapedReviews = [review].concat(scrapedReviews)
    scrapedReviews.length = 10
    scrapedReviews = scrapedReviews.filter(Boolean)
    await statsCache.hset('lastTenScrapedReviews', JSON.stringify(scrapedReviews))
  })
  events.on('captcha', async ({ url }) => log('found captcha', url))
  events.on('content', handleContent(statsCache))
  events.on('screenshot', handleScreenshot(statsCache))

  process.on('unhandledRejection', (err) => log('unhandled rejection', err.message, err))
  process.on('uncaughtException', (err) => log('uncaught exception', err.message, err))
}

function handleScreenshot (statsCache) {
  return async (screenshot) => {
    log('received screenshot', screenshot)
    let lastTenScreenshots = await statsCache.hget('lastTenScreenshots') || '[]'
    try { lastTenScreenshots = JSON.parse(lastTenScreenshots) } catch (err) { lastTenScreenshots = [] }
    lastTenScreenshots = [screenshot].concat(lastTenScreenshots)
    lastTenScreenshots.length = 10
    lastTenScreenshots = lastTenScreenshots.filter(Boolean)
    await statsCache.hset('lastTenScreenshots', JSON.stringify(lastTenScreenshots))
  }
}

function handleContent (statsCache) {
  return async ({ content }) => {
    log('scraped content', (content || '').substring(0, 500))
    await statsCache.hincrby('scrapedPages', 1)
  }
}
