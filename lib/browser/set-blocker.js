const log = require('debug')('mega-scraper:set-blocker')

module.exports = async function setBlocker (page, { url, timeout, stylesheets, javascript, images } = {}) {
  log('using blocker')
  try { await page.setRequestInterception(true) } catch (err) { log(err.message) }
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
    'adnxs.com',
    'contextweb.com',
    'lijit.com'
  ]
  if (!stylesheets && process.env.STYLESHEETS !== 'true') {
    log('blocking stylesheets')
    blockedResourceTypes.push('stylesheet')
  }
  if (!javascript && process.env.JAVASCRIPT !== 'true') {
    log('blocking javascript')
    blockedResourceTypes.push('javascript')
  }
  if (!images && process.env.IMAGES !== 'true') {
    log('blocking images')
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

  page.on('request', async (interceptedRequest) => {
    const requestUrl = interceptedRequest._url.split('?')[0].split('#')[0]
    if (
      blockedResourceTypes.includes(interceptedRequest.resourceType()) ||
      skippedResources.some(resource => requestUrl.includes(resource)) ||
      skippedMatches.some(m => m.test(requestUrl))
    ) {
      // log('blocking', requestUrl)
      return interceptedRequest.abort().catch(Function.prototype)
    }
    // log('pass', requestUrl)

    // return interceptedRequest.continue().catch(Function.prototype)
  })
}
