const test = require('ava')
const { getQueueName } = require('./queue')

test('gets queue id for generic url', t => {
  t.true(/scrape_\w+/.test(getQueueName('https://www.wikipedia.org')))
})
