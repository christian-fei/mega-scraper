const test = require('ava')
const { nextPageUrlFromUrl } = require('./amazon')

test('extracts next page (page 2) given amazon.it product-reviews url', t => {
  t.is(
    'https://amazon.it/product-reviews/B07PHPXHQS/?pageNumber=2',
    nextPageUrlFromUrl('https://www.amazon.it/Echo-Dot-generazione-Altoparlante-intelligente/product-reviews/B07PHPXHQS')
  )
})
