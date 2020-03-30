const puppeteer = require('puppeteer')
const getFreeProxies = require('get-free-https-proxy')

;(async () => {
  const proxies = await getFreeProxies()
  const proxy1 = proxies[Math.max(0, parseInt(proxies.length * Math.random()) - 1)]
  console.log('using proxy', proxy1)
  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      `--proxy-server=${proxy1.host}:${proxy1.port}`
    ],
    headless: true,
    ignoreHTTPSErrors: true
  })
  const page = await browser.newPage()
  await page.goto('https://ipinfo.io/json')
  const content = await page.content()
  const serialized = content.substring(content.indexOf('{'), content.indexOf('}') + 1)

  console.log(JSON.parse(serialized))

  await page.waitFor(1000)
  await page.close()
  await browser.close()

  process.exit(0)
})()
