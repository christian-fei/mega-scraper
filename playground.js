const { browser: { createBrowser } } = require('.')

;(async () => {
  const browser = await createBrowser({ proxy: true })

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
