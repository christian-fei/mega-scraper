const log = require('debug')('mega-scraper:queue')
const Bull = require('bull')
const keysToLower = require('../util/keys-to-lower')
const { extractAsin } = require('../url-logics/amazon')

module.exports = {
  createQueue,
  getQueueName
}

function createQueue (queueNameOrUrl, config = keysToLower(process.env)) {
  let queueName = queueNameOrUrl
  if (/http/.test(queueNameOrUrl)) {
    queueName = getQueueName(queueNameOrUrl)
  }
  log('create new queue', queueName)
  const port = config.redis_port || config.npm_config_redis_port
  const host = config.redis_host || config.npm_config_redis_host
  const queue = new Bull(queueName, { redis: { port, host } })
  queue.clean(0, 'wait')
  queue.clean(0, 'active')
  queue.clean(0, 'delayed')
  queue.clean(0, 'failed')
  return queue
}
function getQueueName (url) {
  const asin = extractAsin(url)
  if (asin) return `scrape_${asin}`
  return `scrape_${guid()}`
  function guid () {
    return (s4() + s4() + '-' + s4() + '-4' + s4().substr(0, 3) + '-' + s4() + '-' + s4() + s4() + s4()).toLowerCase()
    function s4 () {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
    }
  }
}
