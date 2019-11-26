const log = require('debug')('mega-scraper:prepare-page')
// const setBlocker = require('./set-blocker')
// const setProxy = require('./set-proxy')
const setStealth = require('./set-stealth')
const randomUA = require('../util/random-ua')
const getFreeHttpsProxy = require('get-free-https-proxy')
const got = require('got')

module.exports = async function preparePage (page, options = {}) {
  log('customized page', options)
  const userAgent = randomUA()
  log('userAgent', userAgent)
  await page.setUserAgent(userAgent)
  await page.setViewport({ width: options.width || 1280, height: options.height || 800 })
  await setStealth(page)

  if (options.blocker || options.proxy) {
    try { await page.setRequestInterception(true) } catch (err) { log(err.message) }
    let proxies = await getFreeHttpsProxy()

    page.on('request', async (interceptedRequest) => {
      const requestUrl = interceptedRequest._url.split('?')[0].split('#')[0]
      if (options.blocker) {
        const blockedResourceTypes = [
          'font',
          'ws',
          'texttrack',
          'object',
          'beacon',
          'csp_report'
        ]
        const skippedResources = [
          'nexusclient',
          'action-impressions',
          '/batch/',
          'quantserve',
          'adzerk',
          'doubleclick',
          'adition',
          'exelator',
          'sharethrough',
          'cdn.api.twitter',
          'google-analytics',
          'googletagmanager',
          'google',
          'fontawesome',
          'facebook',
          'analytics',
          'optimizely',
          'clicktale',
          'mixpanel',
          'zedo',
          'clicksor',
          'tiqcdn',
          'amazon-adsystem',
          'aj/private',
          '/gp/overlay',
          'm.media-amazon.co',
          'adnxs.com',
          'contextweb.com',
          'lijit.com'
        ]
        if (!options.stylesheets && process.env.STYLESHEETS !== 'true') {
          // log('blocking stylesheets')
          blockedResourceTypes.push('stylesheet')
        }
        if (!options.javascript && process.env.JAVASCRIPT !== 'true') {
          // log('blocking javascript')
          blockedResourceTypes.push('javascript')
        }
        if (!options.images && process.env.IMAGES !== 'true') {
          // log('blocking images')
          blockedResourceTypes.push('image')
          blockedResourceTypes.push('media')
          blockedResourceTypes.push('imageset')
        }
        const skippedMatches = [
          /amazon\.\w+\/1/,
          /amazon\.\w+\/cem/,
          /action-impressions/,
          /AUIClients/
        ]

        const requestUrl = interceptedRequest._url.split('?')[0].split('#')[0]
        if (
          blockedResourceTypes.includes(interceptedRequest.resourceType()) ||
            skippedResources.some(resource => requestUrl.includes(resource)) ||
            skippedMatches.some(m => m.test(requestUrl))
        ) {
          // log('blocking', requestUrl)
          return interceptedRequest.abort().catch(Function.prototype)
        }
      }
      if (options.proxy) {
        const index = Math.min(proxies.length, parseInt(Math.random() * proxies.length, 10))
        const proxy = proxies[index]
        if (!proxy) return
        log('using proxy', requestUrl, proxy, index)
        await got({
          url: interceptedRequest.url(),
          method: interceptedRequest.method(),
          headers: Object.assign({}, interceptedRequest.headers(), options.cookie ? { cookie: options.cookie } : {}),
          body: interceptedRequest.postData(),
          proxy: `https://${proxy.host}:${proxy.port}`,
          timeout: options.timeout || 2000
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
      }

      await interceptedRequest.continue().catch(Function.prototype)
    })
  }

  return page
}
