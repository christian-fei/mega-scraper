const puppeteer = require('puppeteer')
const getFreeProxies = require('get-free-https-proxy')

;(async () => {
  const [proxy1] = await getFreeProxies()
  console.log('using proxy', proxy1)
  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      `--proxy-server=${proxy1.host}:${proxy1.port}`
    ],
    headless: false,
    ignoreHTTPSErrors: true
  })
  const page = await browser.newPage()
  await page.goto('https://ipinfo.io/json')
  const content = await page.content()
  const serialized = content.substring(content.indexOf('{'), content.indexOf('}') + 1)

  console.log(JSON.parse(serialized))

  await page.waitFor(5000)
  await page.close()
  await browser.close()

  process.exit(0)
})()
