#!/usr/bin/env node

const log = require('debug')('mega-scraper:migration:01:html-json-folders')
const fs = require('fs')
const path = require('path')
const migrationsConfig = require('./migrations/config.json')
const cp = require('child_process')

if (require.main === module) {
  main()
    .then(() => {
      process.exit(0)
    })
    .catch((err) => {
      log(err)
      process.exit(1)
    })
} else {
  module.exports = main
}

async function main () {
  const migrationsPath = path.resolve(__dirname, 'migrations')
  let migrationFilenames = fs.readdirSync(migrationsPath)
  migrationFilenames = migrationFilenames
    .filter(f => f !== 'config.json')
    .filter(f => !migrationsConfig.migrated.find(({ filename }) => filename === f))

  console.log(`migrations to run: \n${migrationFilenames.map(f => `- ${f}`).join('\n')}\n`)

  for (const filename of migrationFilenames) {
    console.time(`running ${path.resolve(migrationsPath, filename)}`)
    try {
      console.log(cp.execFileSync(path.resolve(migrationsPath, filename)).toString())
    } catch (err) {
      console.error(err)
    }
    console.timeEnd(`running ${path.resolve(migrationsPath, filename)}`)

    const date = new Date().toISOString()
    migrationsConfig.migrated.push({ filename, date })
  }

  const configPath = path.resolve(migrationsPath, 'config.json')
  console.log(`writing config to ${configPath}\n${JSON.stringify(migrationsConfig, null, 2)}`)
  fs.writeFileSync(configPath, JSON.stringify(migrationsConfig, null, 2))
}
