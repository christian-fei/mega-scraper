#!/usr/bin/env node

const log = require('debug')('mega-scraper:migration:01:folders-cleanup')
const fs = require('fs')
const cp = require('child_process')
const path = require('path')

if (require.main === module) {
  log('exec me')
  main()
    .then(() => {
      process.exit(0)
    })
    .catch((err) => {
      log(err)
      process.exit(1)
    })
} else {
  log('require me')
  module.exports = main
}

async function main () {
  const types = ['html', 'json']
  for (const type of types) {
    const typeListing = fs.readdirSync(path.resolve(__dirname, '..', type))
    const uniqueSet = typeListing.reduce((acc, curr) => {
      acc.add(curr.match(/[\w]+/)[0])
      return acc
    }, new Set())

    const unique = [...uniqueSet]
    log(unique)

    unique.forEach(u => {
      const pathname = path.resolve(__dirname, '..', type, u)
      try {
        fs.mkdirSync(pathname, { recursive: true })
        log(`successfully created ${pathname}`)
      } catch (err) {
        log(`failed to create ${pathname}`, err.message)
      }
    })
    unique.forEach(u => {
      const pathname = path.resolve(__dirname, '..', type, u)

      log(`moving ${u}-* to ${pathname}`)
      try {
        cp.execSync(`mv ${pathname}-* ${pathname}/`)
        log(`successfully moved files from ${pathname}-* to ${pathname}/`)
      } catch (err) {
        log(`failed to move files from ${pathname}-* to ${pathname}/`)
      }
    })
  }
}
