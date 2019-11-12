const log = require('debug')('sar:create-queue')
const Bull = require('bull')

module.exports = function createQueue (queueName, config = keysToLower(process.env)) {
  log('create new queue', queueName)
  const port = config.redis_port || config.npm_config_redis_port
  const host = config.redis_host || config.npm_config_redis_host
  return new Bull(queueName, { redis: { port, host } })
}

function keysToLower (obj = {}) {
  return Object.keys(obj).reduce((acc, key) => Object.assign(acc, { [key.toLowerCase()]: acc[key] }), {})
}
