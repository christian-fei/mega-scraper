#!/usr/bin/env node

const log = require('debug')('sar:migration:01:html-json-folders')
const fs = require('fs')
const path = require('path')

if (require.main === module) {
  console.log('exec me')
  main()
    .then(() => {
      process.exit(0)
    })
    .catch((err) => {
      log(err)
      process.exit(1)
    })
} else {
  console.log('require me')
  module.exports = main
}

async function main () {
  const htmlListing = fs.readdirSync(path.resolve(__dirname, '..', 'html'))
  console.log('htmlListing', htmlListing)
}
