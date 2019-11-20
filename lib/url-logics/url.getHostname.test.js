const test = require('ava')
const { getHostname } = require('./url')

test('gets hostname for www.amazon.it url', t => {
  t.is(
    'amazon.it',
    getHostname('https://www.amazon.it/product-reviews/B07PHPXHQS')
  )
})
