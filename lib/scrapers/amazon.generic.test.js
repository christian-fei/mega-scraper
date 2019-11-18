const test = require('ava')
const amazonGeneric = require('./amazon.generic')
const EventEmitter = require('events')
const createQueue = require('../create-queue')
const createBrowser = require('../create-browser')

test('scrapes url https://www.amazon.it/Echo-Dot-generazione-Altoparlante-intelligente/product-reviews/B07PHPXHQS/', async t => {
  const events = new EventEmitter()
  const queue = createQueue('test')
  const browser = await createBrowser({ headless: true })

  amazonGeneric({ url: 'https://www.amazon.it/Echo-Dot-generazione-Altoparlante-intelligente/product-reviews/B07PHPXHQS/', toPage: 4, queue, events, browser })

  return new Promise((resolve, reject) => {
    events.on('review', (review) => {
      t.truthy(review)
    })
    events.on('done', (result) => {
      t.is(result, undefined)
      resolve(result)
    })
  })
})
