const test = require('ava')
const getPuppeteerOptions = require('./get-puppeteer-options')

test('contains args', t => {
  const options = {}
  t.deepEqual([
    '--no-sandbox',
    // '--single-process',
    // '--no-zygote',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--no-first-run',
    '--window-size=1280,800',
    '--window-position=0,0',
    '--ignore-certificate-errors',
    '--ignore-certificate-errors-skip-list',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--hide-scrollbars',
    '--disable-notifications',
    '--disable-extensions',
    '--force-color-profile=srgb',
    '--mute-audio',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-breakpad',
    '--disable-component-extensions-with-background-pages',
    '--disable-features=TranslateUI,BlinkGenPropertyTrees',
    '--disable-ipc-flooding-protection',
    '--disable-renderer-backgrounding',
    '--enable-features=NetworkService,NetworkServiceInProcess'
  ], getPuppeteerOptions(options).args)
})
test('contains args (with custom --window-size)', t => {
  const options = { width: 2560, height: 1600 }
  t.deepEqual([
    '--no-sandbox',
    // '--single-process',
    // '--no-zygote',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--no-first-run',
    '--window-size=2560,1600',
    '--window-position=0,0',
    '--ignore-certificate-errors',
    '--ignore-certificate-errors-skip-list',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--hide-scrollbars',
    '--disable-notifications',
    '--disable-extensions',
    '--force-color-profile=srgb',
    '--mute-audio',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-breakpad',
    '--disable-component-extensions-with-background-pages',
    '--disable-features=TranslateUI,BlinkGenPropertyTrees',
    '--disable-ipc-flooding-protection',
    '--disable-renderer-backgrounding',
    '--enable-features=NetworkService,NetworkServiceInProcess'
  ], getPuppeteerOptions(options).args)
})
test('contains ignoreHTTPSErrors set to true', t => {
  const options = { }
  t.true(getPuppeteerOptions(options).ignoreHTTPSErrors)
})
test('contains headless set to true', t => {
  const options = { headless: true }
  t.true(getPuppeteerOptions(options).headless)
})
test('contains incognito set to true', t => {
  const options = { incognito: true }
  t.true(getPuppeteerOptions(options).args.includes('--incognito'))
})
test('contains slowMo set to 500', t => {
  const options = { slowMo: 500 }
  t.is(500, getPuppeteerOptions(options).slowMo)
})
test('contains proxy', t => {
  const options = { proxy: '127.0.0.1:19999' }
  t.true(getPuppeteerOptions(options).args.includes('--proxy-server=127.0.0.1:19999'))
})
test('contains proxy with {endpoint, username, password}', t => {
  const options = { proxy: { endpoint: '127.0.0.1:19999', username: 'username', password: 'password' } }
  t.true(getPuppeteerOptions(options).args.includes('--proxy-server=127.0.0.1:19999'))
})
