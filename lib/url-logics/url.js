const { URL } = require('url')

module.exports = {
  normalizeUrl,
  getHostname
}

function normalizeUrl (url) {
  return (url || '').replace(/\//gi, '!').replace(/\?/, '_')
}

function getHostname (url) {
  const { hostname } = new URL(url)
  return hostname.replace(/^www\./gi, '')
}
