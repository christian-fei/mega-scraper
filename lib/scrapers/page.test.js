const test = require('ava')
const page = require('./page')
const EventEmitter = require('events')
const createQueue = require('../create-queue')
const createBrowser = require('../create-browser')

test.cb('scrapes url', t => {
  const events = new EventEmitter()
  const queue = createQueue('test')
  createBrowser({})
    .then(async browser => {
      await page({ url: 'https://google.com', queue, events, browser })
      events.on('done', (result) => {
        t.truthy(result.includes('google'), result)
        t.end()
      })
    })
})
