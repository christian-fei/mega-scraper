#!/usr/bin/env node

const fs = require('fs')
const http = require('http')
const path = require('path')

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(err => { console.error(err); process.exit(1) })
} else {
  module.exports = main
}

async function main ({ port = process.env.PORT || process.env.HTTP_PORT || 4000 } = {}) {
  const httpServer = http.createServer()
  httpServer.on('request', requestHandler)
  httpServer.listen(port)
}

function read (filepath, defaultValue) {
  try {
    return fs.readFileSync(filepath)
  } catch (err) {
    return defaultValue
  }
}

function requestHandler (req, res) {
  if (req.url === '/') {
    console.log('📖  [server] index', req.url)
    res.write(index())
    return res.end()
  }
  if (req.url === '/favicon.ico') return res.end()

  console.log('⛔️  [server] unhandled', req.url)

  res.end()
}

function index () {
  const filepath = path.join(process.cwd(), 'index.html')
  return read(filepath)
}
