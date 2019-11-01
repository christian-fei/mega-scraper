#!/usr/bin/env node

const log = require('debug')('server')
const fs = require('fs')
const http = require('http')
const path = require('path')

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(err => { log(err); process.exit(1) })
} else {
  module.exports = main
}

async function main ({ port = process.env.PORT || process.env.HTTP_PORT || 4000 } = {}) {
  const httpServer = http.createServer()
  httpServer.on('request', requestHandler)
  httpServer.listen(port)

  log('server listening on', port)
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
    log('📖  [server] index', req.url)
    res.write(index())
    return res.end()
  }
  if (req.url === '/sse') {
    log('📖  [server] sse', req.url)
    res.setHeader('Cache-Control: no-cache')
    res.setHeader('Content-Type: text/event-stream\n\n')

    const handle = setInterval(() => {
      res.write('event: ping\n')
      res.write(`data: ${JSON.stringify({ time: new Date().toISOString() })}\n`)
    }, 1000)

    // res.write(index())
    return res.end()
  }
  if (req.url === '/favicon.ico') return res.end()

  log('⛔️  [server] unhandled', req.url)

  res.end()
}

function index () {
  const filepath = path.join(process.cwd(), 'index.html')
  return read(filepath)
}
