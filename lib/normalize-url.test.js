const test = require('ava')
const normalizeUrl = require('./normalize-url')

test('converts all object keys to lower', t => {
  t.is(
    'https:!!www.amazon.com!Echo-Dot-3rd-Gen-Charcoal!product-reviews!B07FZ8S74R!',
    normalizeUrl('https://www.amazon.com/Echo-Dot-3rd-Gen-Charcoal/product-reviews/B07FZ8S74R/')
  )
})
