const log = require('debug')('mega-scraper:stats-cache')
const Redis = require('ioredis')
const keysToLower = require('../util/keys-to-lower')

module.exports = function cache (key = 'stats', config = keysToLower(process.env)) {
  log('creating new cache for', key)
  const redis = new Redis({
    db: +config.redis_db || 0,
    port: config.redis_port,
    password: config.redis_password,
    host: config.redis_host
  })

  return {
    hset: async (field, value) => {
      // log('set', key, field, value)
      return redis.hset(key, field, value)
    },
    hget: async (field) => {
      // log('hget', key, field)
      return redis.hget(key, field)
    },
    hincrby: async (field, increment) => {
      // log('hincrby', key, field, increment)
      return redis.hincrby(key, field, increment)
    },
    hincrbyfloat: async (field, increment) => {
      // log('hincrbyfloat', key, field, increment)
      return redis.hincrbyfloat(key, field, increment)
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
