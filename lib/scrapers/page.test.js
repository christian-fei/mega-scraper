const test = require('ava')
const page = require('./page')
const EventEmitter = require('events')
const createQueue = require('../create-queue')

test.cb('extracts stars from single review html', t => {
  const events = new EventEmitter()
  const queue = createQueue('test')

  page({ url: 'https://google.com', queue, events })

  events.on('done', (result) => {
    t.truthy(result.includes('google'), result)
    t.end()
  })
})
