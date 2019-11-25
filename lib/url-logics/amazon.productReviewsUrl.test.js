const test = require('ava')
const { productReviewsUrl } = require('./amazon')

test('extracts page 1 given amazon.it product-reviews url', t => {
  t.is(
    'https://amazon.it/product-reviews/B07PHPXHQS/?pageNumber=1',
    productReviewsUrl({ url: 'https://amazon.it/product-reviews/B07PHPXHQS/', pageNumber: '1' })
  )
})
