const log = require('debug')('mega-scraper:prepare-page')
// const setBlocker = require('./set-blocker')
// const setProxy = require('./set-proxy')
const setStealth = require('./set-stealth')
const randomUA = require('../util/random-ua')
const getFreeHttpsProxy = require('get-free-https-proxy')
const got = require('got')

module.exports = async function preparePage (page, options = {
  proxy: true,
  stylesheets: false,
  javascript: false,
  headless: true,
  images: false,
  cookie: undefined,
  width: 1280,
  height: 800,
  slowMo: undefined,
  userAgent: undefined,
  timeout: 5000
}) {
  log('customized page', options)
  const userAgent = options.userAgent || randomUA()
  log('userAgent', userAgent)
  await page.setCacheEnabled(false)
  await page.setUserAgent(userAgent)
  await page.setViewport({ width: options.width || 1280, height: options.height || 800 })
  await setStealth(page)

  if ((!options.images || !options.javascript || !options.stylesheets) || options.proxy) {
    try { await page.setRequestInterception(true) } catch (err) { log(err.message) }
    let proxies = options.proxy ? await getFreeHttpsProxy() : []

    page.on('request', async (interceptedRequest) => {
      if (interceptedRequest.url().endsWith('/__webpack_hmr')) {
        return interceptedRequest.abort()
      }
      const requestUrl = interceptedRequest._url.split('?')[0].split('#')[0]
      if ((!options.images || !options.javascript || !options.stylesheets)) {
        const blockedResourceTypes = getBlockedResourceTypes()
        const skippedResources = getSkippedResources()

        if (!options.stylesheets && process.env.STYLESHEETS !== 'false') {
          // log('blocking stylesheets')
          blockedResourceTypes.push('stylesheet')
        }
        if (!options.javascript && process.env.JAVASCRIPT !== 'false') {
          // log('blocking javascript')
          blockedResourceTypes.push('javascript')
        }
        if (!options.images && process.env.IMAGES !== 'false') {
          // log('blocking images')
          blockedResourceTypes.push('image')
          blockedResourceTypes.push('media')
          blockedResourceTypes.push('imageset')
          skippedResources.push('images-')
        }
        const skippedMatches = [
          /amazon\.\w+\/1/,
          /amazon\.\w+\/cem/,
          /action-impressions/,
          /AUIClients/,
          /youtube/,
          /media\./
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
      if (options.proxy === true || (options.proxy && (options.proxy.host || options.proxy.endpoint))) {
        const headers = Object.assign({}, interceptedRequest.headers(), options.cookie ? { cookie: options.cookie } : {})
        const requestOptions = {
          url: interceptedRequest.url(),
          method: interceptedRequest.method(),
          body: interceptedRequest.postData(),
          timeout: options.timeout || 2000
        }
        let proxy
        let proxyIndex
        if (options.proxy === true) {
          proxyIndex = Math.min(proxies.length, parseInt(Math.random() * proxies.length, 10))
          proxy = proxies[proxyIndex]
        } else {
          proxy = options.proxy
        }

        if (proxy) {
          log('using proxy', requestUrl, proxy)
          requestOptions.proxy = `https://${proxy.host || proxy.endpoint}${proxy.port ? `:${proxy.port}` : ''}`
          if (proxy.username && proxy.password) {
            headers['Proxy-Authorization'] = 'Basic ' + Buffer.from(`${proxy.username}:${proxy.password}`).toString('base64')
          }
        }

        requestOptions.headers = headers

        await got(requestOptions)
          .then(response => interceptedRequest.respond({
            status: response.statusCode,
            contentType: response.headers['content-type'],
            headers: response.headers,
            body: response.body
          }))
          .catch(async (_) => {
            proxies = proxies.filter((_, i) => i !== proxyIndex)
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

function getBlockedResourceTypes () {
  return [
    'font',
    'ws',
    'texttrack',
    'object',
    'beacon',
    'csp_report'
  ]
}

function getSkippedResources () {
  return [
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
}
