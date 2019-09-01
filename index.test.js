const tap = require('tap')
const got = require('got')

tap.test('get page html content', async t => {
  t.plan(1)

  const html = await getHtml('porta carta credito')

  t.true(html.body.indexOf('s-search-results'))
})

tap.test('get product details', async t => {
  t.plan(1)

  const html = await getProductDetails('B07VF7YVX4')

  t.true(html.body.indexOf('B07VF7YVX4'))
})

async function getHtml (search) {
  return got(`https://www.amazon.it/s?k=${encodeURIComponent(search)}`)
}
async function getProductDetails (asin) {
  return got(`https://www.amazon.it/dp/${asin}`)
}
