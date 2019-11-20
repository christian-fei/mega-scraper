const log = require('debug')('mega-scraper:create-queue')
const Bull = require('bull')
const keysToLower = require('./util/keys-to-lower')

module.exports = {
  createQueue
}

function createQueue (queueName, config = keysToLower(process.env)) {
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
