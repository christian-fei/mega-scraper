const got = require('got')
const getFreeHttpsProxy = require('get-free-https-proxy')
const tunnel = require('tunnel')

module.exports = get

async function get ({ url, headers = {}, useProxy = false }) {
  if (useProxy) {
    const [proxy] = await getFreeHttpsProxy()
    headers.agent = tunnel.httpOverHttp({ proxy })
  }
  return got(url, { headers })
}
