const log = require('debug')('mega-scraper:set-proxy')
const got = require('got')
const getFreeHttpsProxy = require('get-free-https-proxy')

module.exports = async function setProxy (page, { url, timeout, stylesheets, javascript, images, cookie } = {}) {
  log('set proxy')
  let proxies = await getFreeHttpsProxy()
  try { await page.setRequestInterception(true) } catch (err) { log(err.message) }

  page.on('request', async (interceptedRequest) => {
    const requestUrl = interceptedRequest._url.split('?')[0].split('#')[0]
    const index = Math.min(proxies.length, parseInt(Math.random() * proxies.length, 10))
    const proxy = proxies[index]

    if (!proxy) return interceptedRequest.continue().catch(Function.prototype)
    log('using proxy', requestUrl, proxy, index)

    await got({
      url: interceptedRequest.url(),
      method: interceptedRequest.method(),
      headers: Object.assign({}, interceptedRequest.headers(), cookie ? { cookie } : {}),
      body: interceptedRequest.postData(),
      proxy: `https://${proxy.host}:${proxy.port}`,
      timeout
    })
      .then(response => interceptedRequest.respond({
        status: response.statusCode,
        contentType: response.headers['content-type'],
        headers: response.headers,
        body: response.body
      }))
      .catch(async (_) => {
        proxies = proxies.filter((_, i) => i !== index)
        if (proxies.length === 0) {
          proxies = await getFreeHttpsProxy()
        }
      })

    await interceptedRequest.continue().catch(Function.prototype)
  })
}
