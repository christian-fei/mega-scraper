const log = require('debug')('sar:stats-cache')
const Redis = require('ioredis')

module.exports = function statsCache (key = 'stats', config = keysToLower(process.env)) {
  const redis = new Redis({ db: 0, port: config.redis_port, host: config.redis_host })

  return {
    hset: async (field, value) => {
      log('set', key, field, value)
      await redis.hset(key, field, value)
    },
    hget: async (field) => {
      log('hget', key, field)
      await redis.hget(key, field)
    },
    hincrby: async (field, increment) => {
      log('hincrby', key, field, increment)
      await redis.hincrby(key, field, increment)
    },
    hincrbyfloat: async (field, increment) => {
      log('hincrbyfloat', key, field, increment)
      await redis.hincrbyfloat(key, field, increment)
    },
    toJSON: async () => {
      const stats = await redis.hgetall(key)
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
