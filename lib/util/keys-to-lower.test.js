const test = require('ava')
const keysToLower = require('./keys-to-lower')

test('converts all object keys to lower', t => {
  t.deepEqual(
    { test: 42, foo: 'bar' },
    keysToLower({ TEST: 42, FOO: 'bar' })
  )
})
