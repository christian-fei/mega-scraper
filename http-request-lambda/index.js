const got = require('got')
// const tunnel = require('tunnel')

module.exports = async function ({ url }) {
  const response = await got(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36'
    }
    // agent: tunnel.httpsOverHttp({
    //   proxy: {
    //     host: '159.65.253.109',
    //     port: 8080
    //   }
    // })
  })
  return response.body
}
