const log = require('debug')('mega-scraper:prepare-page')
const setStealth = require('./set-stealth')
const randomUA = require('../util/random-ua')
const { proxyRequest } = require('puppeteer-proxy')
const useProxy = require('puppeteer-page-proxy')

var HttpsProxyAgent = require('https-proxy-agent')

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
  timeout: 5000
}) {
  log('prepare page', options)
  const userAgent = options.userAgent || randomUA()
  log('userAgent', userAgent)
  await page.setCacheEnabled(false)
  await page.setUserAgent(userAgent)
  await page.setViewport({ width: options.width || 1280, height: options.height || 800 })

  await setStealth(page)
  await useProxy(page, getProxyUrl(options.proxy))

  try {
    await page.setRequestInterception(true)
    page.on('request', interceptRequest)
  } catch (err) { log(err.message, err) }

  return page

  async function interceptRequest (interceptedRequest) {
    try {
      if (interceptedRequest.url().endsWith('/__webpack_hmr')) {
        return interceptedRequest.abort()
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
        /youtube/,
        /media\./
      ]

      const requestUrl = interceptedRequest._url // .split('?')[0].split('#')[0]
      if (
        !requiredResources.some(resource => requestUrl.includes(resource)) &&
            (blockedResourceTypes.includes(interceptedRequest.resourceType()) ||
            skippedResources.some(resource => requestUrl.includes(resource)) ||
              skippedMatches.some(m => m.test(requestUrl)))
      ) {
        log('blocking request', requestUrl)
        return interceptedRequest.abort().catch(Function.prototype)
      }

      if (false && (options.proxy === true || (options.proxy && (options.proxy.host || options.proxy.endpoint)))) {
        log('proxying request', requestUrl, options.proxy)
        let host, port, auth
        if (typeof options.proxy === 'object') {
          if (options.proxy.host && options.proxy.port) {
            host = options.proxy.host
            port = options.proxy.port
          } else if (options.proxy.endpoint) {
            const matches = (options.proxy.host || options.proxy.endpoint).split(':')
            host = matches[0]
            port = matches[1]
          } else if (typeof options.proxy === 'string') {
            const matches = options.proxy.split(':')
            host = matches[0]
            port = matches[1]
          }
        }
        if (options.proxy.username && options.proxy.password) {
          auth = `${encodeURIComponent(options.proxy.username)}:${encodeURIComponent(options.proxy.password)}`
        }

        const proxyUrl = `https://${auth ? auth + '@' : ''}${host}:${port}`
        console.log({ proxyUrl })

        return useProxy(interceptedRequest, proxyUrl)

        const agent = new HttpsProxyAgent({
          host,
          port,
          auth
        })

        return proxyRequest({
          agent,
          page,
          proxyUrl: `https://${options.host || options.endpoint}${options.port ? `:${options.port}` : ''}`,
          request: interceptedRequest
        })
      }

      log('passing request', requestUrl, interceptedRequest.resourceType())

      // await interceptedRequest.continue().catch(Function.prototype)
    } catch (err) {
      log(err.message, err)
      // await interceptedRequest.continue().catch(Function.prototype)
    }
    log('fall through request')
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
