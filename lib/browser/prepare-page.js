const log = require('debug')('mega-scraper:prepare-page')
const setStealth = require('./set-stealth')
const randomUA = require('../util/random-ua')
const useProxy = require('puppeteer-page-proxy')

module.exports = async function preparePage (page, options = {
  proxy: true,
  stylesheets: true,
  javascript: true,
  headless: true,
  images: true,
  cookie: undefined,
  width: 1280,
  height: 800,
  slowMo: undefined,
  userAgent: undefined,
  proxySingleRequests: true,
  timeout: 5000
}) {
  log('prepare page', options)
  const userAgent = options.userAgent || randomUA()
  log('userAgent', userAgent)
  await page.setCacheEnabled(false)
  await page.setUserAgent(userAgent)
  await page.setViewport({ width: options.width || 1280, height: options.height || 800 })
  await page.setExtraHTTPHeaders({ 'accept-language': 'en-US,en;q=0.8' })

  await setStealth(page)

  if (options.proxySingleRequests) {
    log('proxying single requests')
    await setupRequestInterception(page, options)
  } else {
    log('not proxying single requests')
  }

  return page
}

async function setupRequestInterception (page, options = {}) {
  try {
    await page.setRequestInterception(true)
    page.on('request', interceptRequest)
  } catch (err) { log(err.message, err) }

  async function interceptRequest (interceptedRequest) {
    const requestUrl = interceptedRequest._url

    try {
      if (interceptedRequest.url().endsWith('/__webpack_hmr')) {
        return interceptedRequest.abort()
      }

      if (interceptedRequest.resourceType() === 'document' || requestUrl.includes('.captcha-delivery.')) {
        return interceptedRequest.continue().catch(Function.prototype)
      }

      const blockedResourceTypes = getBlockedResourceTypes()
      const skippedResources = getSkippedResources()
      const requiredResources = getRequiredResources()

      if (!options.stylesheets || process.env.STYLESHEETS === 'false') {
        log('blocking stylesheets')
        blockedResourceTypes.push('stylesheet')
      }
      if (!options.javascript || process.env.JAVASCRIPT === 'false') {
        log('blocking javascript')
        blockedResourceTypes.push('javascript')
      }
      if (!options.images || process.env.IMAGES === 'false') {
        log('blocking images')
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
        /youtube\./,
        /media\./
      ]

      if (
        !requiredResources.some(resource => requestUrl.includes(resource)) &&
            (blockedResourceTypes.includes(interceptedRequest.resourceType()) ||
            skippedResources.some(resource => requestUrl.includes(resource)) ||
              skippedMatches.some(m => m.test(requestUrl)))
      ) {
        log('blocking request', requestUrl)
        return interceptedRequest.abort().catch(Function.prototype)
      }

      if (!requestUrl.includes(options.url) && (typeof options.proxy === 'object' && (options.proxy.host || options.proxy.endpoint))) {
        log('proxying request', requestUrl, options.proxy)
        return useProxy(interceptedRequest, getProxyUrl(options.proxy))
      }

      log('passing request', requestUrl, interceptedRequest.resourceType())
    } catch (err) {
      log('there was an issue processing request, continuing', requestUrl, err.message, err)
    }

    log('fall through request', requestUrl, interceptedRequest.resourceType())

    return interceptedRequest.continue().catch(Function.prototype)
  }
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

function getRequiredResources () {
  return [
    'bv-analytics',
    'bazaarvoice'
  ]
}

function getProxyUrl (proxy = {}) {
  let host, port, auth
  if (typeof proxy === 'object') {
    if (proxy.host && proxy.port) {
      host = proxy.host
      port = proxy.port
    } else if (proxy.endpoint) {
      const matches = (proxy.host || proxy.endpoint).split(':')
      host = matches[0]
      port = matches[1]
    } else if (typeof proxy === 'string') {
      const matches = proxy.split(':')
      host = matches[0]
      port = matches[1]
    }

    if (proxy.username && proxy.password) {
      auth = `${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password)}`
    }
  }

  const proxyUrl = `https://${auth ? auth + '@' : ''}${host}:${port}`

  return proxyUrl
}
