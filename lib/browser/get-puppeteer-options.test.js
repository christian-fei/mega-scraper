const test = require('ava')
const getPuppeteerOptions = require('./get-puppeteer-options')

test('contains args', t => {
  const options = {}
  t.deepEqual([
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--no-first-run',
    `--window-size=1280,800`,
    '--window-position=0,0',
    '--ignore-certifcate-errors',
    '--ignore-certifcate-errors-skip-list',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--hide-scrollbars',
    '--disable-notifications'
  ], getPuppeteerOptions(options).args)
})
test('contains args (with custom --window-size)', t => {
  const options = { width: 2560, height: 1600 }
  t.deepEqual([
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-infobars',
    '--no-first-run',
    `--window-size=2560,1600`,
    '--window-position=0,0',
    '--ignore-certifcate-errors',
    '--ignore-certifcate-errors-skip-list',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    '--hide-scrollbars',
    '--disable-notifications'
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
test('contains slowMo set to 500', t => {
  const options = { slowMo: 500 }
  t.is(500, getPuppeteerOptions(options).slowMo)
})