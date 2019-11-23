const test = require('ava')
const page = require('./page')
const EventEmitter = require('events')
const createBrowser = require('../browser/create-browser')

test('scrapes url https://wikipedia.org', async t => {
  const events = new EventEmitter()
  const browser = await createBrowser({ headless: true, images: false, javascript: false, stylesheets: false })

  await page({ url: 'https://wikipedia.org', events, browser })

  return new Promise((resolve, reject) => {
    events.on('done', (err, result) => {
      t.is(err, null)
      t.truthy(result)
      t.true(result.includes('Encyclopedia'), result)
      resolve(result)
    })
  })
})
