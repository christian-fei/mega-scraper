const { URL } = require('url')

module.exports = function getHostname (url) {
  const { hostname } = new URL(url)
  return hostname.replace(/^www\./gi, '')
}
