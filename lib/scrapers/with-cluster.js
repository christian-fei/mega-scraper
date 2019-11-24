const log = require('debug')('mega-scraper:scrapers:with-cluster')
const { Cluster } = require('puppeteer-cluster')

module.exports = async function withCluster ({ url, processFn, puppeteerOptions = {}, ...options }) {
  log('creating cluster')
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 4,
    puppeteerOptions,
    retryDelay: 3000,
    retryLimit: 3,
    monitor: true
  })

  cluster.on('taskerror', (err, data) => {
    log(`Error crawling ${data}: ${err.message}`)
  })

  await cluster.task(processFn)

  log('processing task', url)
  cluster.queue({ url })

  return { ...options, cluster }
}
