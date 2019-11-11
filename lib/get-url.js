const log = require('debug')('sar:get-url')
const puppeteer = require('../puppeteer')
const http = require('../http')
const lambda = require('../http-request-lambda')

module.exports = function getUrl (options = { useProxy: true, puppeteer: false, lambda: false }) {
  log(options)
  if (options.puppeteer) return puppeteer(options)
  if (options.lambda) return lambda(options)
  return http(options)
}
