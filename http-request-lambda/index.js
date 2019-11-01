const chromium = require('chrome-aws-lambda')

module.exports = async function ({ url }) {
  console.log('downloading url', url)
  const proxyUrl = '5.196.132.124:3128'
  const browser = await chromium.puppeteer.launch({
    args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox', `--proxy-server=${proxyUrl}`],
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: false
  })

  const page = await browser.newPage()
  console.log('instanciated new browser page')
  page.setUserAgent(randomUserAgent())

  console.log('visiting url', url)
  await page.goto(url)

  const content = await page.content()

  console.log('got content', content.substring(0, 1000), content.length)

  await browser.close()

  return content
}

function randomUserAgent () {
  const ua = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:67.0) Gecko/20100101 Firefox/67.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:67.0) Gecko/20100101 Firefox/67.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:67.0) Gecko/20100101 Firefox/67.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36',
    'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:67.0) Gecko/20100101 Firefox/67.0'
  ]

  return ua[Math.floor(ua.length * Math.random())]
}
