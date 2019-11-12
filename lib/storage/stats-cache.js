const log = require('debug')('sar:stats-cache')
const Redis = require('ioredis')

module.exports = function statsCache (config = keysToLower(process.env)) {
  const redis = new Redis({ db: 0, port: config.redis_port, host: config.redis_host })

  return {
    set: async (key, value) => {
      log('set', key, value)
      await redis.hset('stats', key, value)
    },
    toJSON: async () => {
      const stats = await redis.hgetall('stats')
      return Object.keys(stats).reduce((acc, key) => {
        if (Number.isFinite(parseFloat(stats[key]))) return Object.assign(acc, { [key]: parseFloat(stats[key]) })
        return Object.assign(acc, { [key]: stats[key] })
      }, {})
    }
  }
}

function keysToLower (obj = {}) {
  return Object.keys(obj).reduce((acc, key) => Object.assign(acc, { [key.toLowerCase()]: acc[key] }), {})
}
