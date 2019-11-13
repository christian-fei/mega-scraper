const log = require('debug')('sar:create-queue')
const Bull = require('bull')
const keysToLower = require('./keys-to-lower')

module.exports = function createQueue (queueName, config = keysToLower(process.env)) {
  log('create new queue', queueName)
  const port = config.redis_port || config.npm_config_redis_port
  const host = config.redis_host || config.npm_config_redis_host
  return new Bull(queueName, { redis: { port, host } })
}
