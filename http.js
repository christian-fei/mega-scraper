const got = require('got')
const getFreeHttpsProxy = require('get-free-https-proxy')
const tunnel = require('tunnel')

module.exports = get

async function get ({ url, headers = {}, useProxy = true }) {
  if (useProxy) {
    const proxies = await getFreeHttpsProxy()
    const index = parseInt(Math.random() * proxies.length / 10, 10)
    const proxy = proxies[index]
    headers.agent = tunnel.httpOverHttp({ proxy })
    console.log('using proxy', proxy, index)
  }
  headers['user-agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.70 Safari/537.36'
  return got(url, { headers })
}
