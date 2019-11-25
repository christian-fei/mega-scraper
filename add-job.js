#!/usr/bin/env node
const debug = require('debug')
debug.enable('mega-scraper:*')
const log = debug('mega-scraper:add-job')
const { createQueue } = require('./lib/queue')

if (require.main === module) {
  addJob(process.argv[2])
    .then(() => process.exit(0))
    .catch(() => process.exit(1))

  process.on('unhandledRejection', err => log(err.message, err))
  process.on('uncaughtException', err => log(err.message, err))
} else {
  module.exports = { addJob }
}

async function addJob (url) {
  log('add job', url)
  const queue = createQueue('scraper')
  const job = await queue.add({ url })

  log(job.id)
  return new Promise((resolve, reject) => {
    const handle = setInterval(async () => {
      const completed = await queue.getCompleted()
      if (completed.some(a => a.id === job.id)) {
        clearInterval(handle)
        resolve()
      }
      const failed = await queue.getFailed()
      if (failed.some(a => a.id === job.id)) {
        clearInterval(handle)
        reject(job.id)
      }
    }, 1000)
  })
}
