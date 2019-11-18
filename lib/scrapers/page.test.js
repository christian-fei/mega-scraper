const test = require('ava')
const page = require('./page')
const EventEmitter = require('events')
const createBrowser = require('../create-browser')

test('scrapes url https://wikipedia.org', async t => {
  const events = new EventEmitter()
  const browser = await createBrowser({ headless: true })

  await page({ url: 'https://wikipedia.org', events, browser })

  return new Promise((resolve, reject) => {
    events.on('done', (result) => {
      t.truthy(result.includes('Encyclopedia'), result)
      resolve(result)
    })
  })
})
