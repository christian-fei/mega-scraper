const test = require('ava')
const page = require('./page')
const createQueue = require('../create-queue')

test.cb('extracts stars from single review html', t => {
  const queue = createQueue('test')

  page({ url: 'https://google.com', queue })
    .then(({ events }) => {
      events.on('done', (result) => {
        t.truthy(result.includes('google'))
        t.end()
      })
    })
})
