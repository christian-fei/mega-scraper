'use strict'

const main = require('./index')

exports.handler = function ({ url }, context, cb) {
  main({ url })
    .then((data) => cb(null, data))
    .catch(err => cb(err))
}
