const UA = require('user-agents')

module.exports = function randomUA () {
  return new UA({ deviceCategory: 'desktop' }).toString()
}
