const test = require('ava')
const amazonGeneric = require('./amazon.generic')
const EventEmitter = require('events')
const { createQueue } = require('../queue')
const createBrowser = require('../create-browser')

test('scrapes url https://www.amazon.it/Echo-Dot-generazione-Altoparlante-intelligente/product-reviews/B07PHPXHQS/', async t => {
  const events = new EventEmitter()
  const queue = createQueue('test_amazon_generic')
  const browser = await createBrowser({ headless: true, images: false, javascript: false, stylesheets: false })

  amazonGeneric({ url: 'https://www.amazon.it/Echo-Dot-generazione-Altoparlante-intelligente/product-reviews/B07PHPXHQS/', toPage: 2, queue, events, browser })

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
