const log = require('debug')('sar:stats-cache')
const Redis = require('ioredis')

module.exports = function statsCache (config = keysToLower(process.env)) {
  const redis = new Redis({ db: 0, port: config.redis_port, host: config.redis_host })

  return {
    hset: async (field, value) => {
      log('set', field, value)
      await redis.hset('stats', field, value)
    },
    hget: async (field) => {
      log('hget', field)
      await redis.hget('stats', field)
    },
    hincrby: async (field, increment) => {
      log('hincrby', field, increment)
      await redis.hincrby('stats', field, increment)
    },
    hincrbyfloat: async (field, increment) => {
      log('hincrbyfloat', field, increment)
      await redis.hincrbyfloat('stats', field, increment)
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
