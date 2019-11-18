const test = require('ava')
const extactAsin = require('./extract-asin')

test('extracts asin given amazon.it product url', t => {
  t.is('B07PHPXHQS', extactAsin('https://www.amazon.it/dp/B07PHPXHQS/'))
})
test('extracts asin given amazon.com product url', t => {
  t.is('B07FZ8S74R', extactAsin('https://www.amazon.com/dp/B07FZ8S74R'))
})
test('extracts asin given amazon.it product-reviews url', t => {
  t.is('B07PHPXHQS', extactAsin('https://www.amazon.it/Echo-Dot-generazione-Altoparlante-intelligente/product-reviews/B07PHPXHQS'))
})
test('extracts asin given amazon.com product-reviews url', t => {
  t.is('B07FZ8S74R', extactAsin('https://www.amazon.com/Echo-Dot-3rd-Gen-Charcoal/product-reviews/B07FZ8S74R/'))
})
