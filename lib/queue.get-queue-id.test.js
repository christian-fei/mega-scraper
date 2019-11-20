const test = require('ava')
const { getQueueId } = require('./queue')

test('gets queue id for amazon.it url', t => {
  t.is(
    'scrape_B07PHPXHQS',
    getQueueId('https://www.amazon.it/Echo-Dot-generazione-Altoparlante-intelligente/product-reviews/B07PHPXHQS')
  )
})
test('gets queue id for amazon.com url', t => {
  t.is(
    'scrape_B07PHPXHQS',
    getQueueId('https://www.amazon.com/Echo-Dot-generazione-Altoparlante-intelligente/product-reviews/B07PHPXHQS')
  )
})
test('gets queue id for generic url', t => {
  t.true(/scrape_\w+/.test(getQueueId('https://www.amazon.com/Echo-Dot-generazione-Altoparlante-intelligente/product-reviews/B07PHPXHQS')))
})
