const test = require('ava')
const { getQueueName } = require('./queue')

test('gets queue id for amazon.it url', t => {
  t.is(
    'scrape_B07PHPXHQS',
    getQueueName('https://www.amazon.it/Echo-Dot-generazione-Altoparlante-intelligente/product-reviews/B07PHPXHQS')
  )
})
test('gets queue id for amazon.com url', t => {
  t.is(
    'scrape_B07PHPXHQS',
    getQueueName('https://www.amazon.com/Echo-Dot-generazione-Altoparlante-intelligente/product-reviews/B07PHPXHQS')
  )
})
test('gets queue id for generic url', t => {
  t.true(/scrape_\w+/.test(getQueueName('https://www.amazon.com/Echo-Dot-generazione-Altoparlante-intelligente/product-reviews/B07PHPXHQS')))
})
