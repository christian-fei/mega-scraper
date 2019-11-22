const log = require('debug')('mega-scraper:scrapers:with-cluster')
const { Cluster } = require('puppeteer-cluster')

module.exports = async function withCluster ({ url, processFn, ...options }) {
  log('creating cluster')
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 2
  })

  await cluster.task(processFn)

  log('processing task', url)
  cluster.queue({ url })

  return { ...options, cluster }
}
