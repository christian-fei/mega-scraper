'use strict'

const main = require('.')

exports.handler = function ({ url }, context, cb) {
  main({ url })
    .then((data) => cb(null, data))
    .catch(err => cb(err))
}
