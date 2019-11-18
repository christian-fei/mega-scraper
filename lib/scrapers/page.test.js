const test = require('ava')
const page = require('./page')
const EventEmitter = require('events')
const createQueue = require('../create-queue')
const createBrowser = require('../create-browser')

test('scrapes url https://wikipedia.org', async t => {
  const events = new EventEmitter()
  const queue = createQueue('test')
  const browser = await createBrowser({ headless: true })

  await page({ url: 'https://wikipedia.org', queue, events, browser })

  return new Promise((resolve, reject) => {
    events.on('done', (result) => {
      t.truthy(result.includes('Encyclopedia'), result)
      resolve(result)
    })
  })
})
