const test = require('ava')
const { getQueueName } = require('.')

test('gets queue id given url', t => {
  t.is(
    'scrape_B07R5Y3QQM',
    getQueueName('https://www.amazon.it/dp/B07R5Y3QQM/')
  )
})
