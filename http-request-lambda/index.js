const got = require('got')

module.exports = async function ({ url }) {
  const response = await got(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.90 Safari/537.36'
    }
  })
  return response.body
}
