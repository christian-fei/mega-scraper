#!/usr/bin/env node

const log = require('debug')('mega-scraper:server')
const fs = require('fs')
const http = require('http')
const path = require('path')

if (require.main === module) {
  createServer()
} else {
  module.exports = createServer
}

function createServer ({ port = process.env.PORT || process.env.HTTP_PORT || 4000 } = {}) {
  let data = {}
  const httpServer = http.createServer()
  httpServer.on('request', requestHandler)
  httpServer.listen(port)

  log(`listening on http://localhost:${port}`)
  return { update: (newData) => { data = newData }, httpServer }

  function requestHandler (req, res) {
    if (req.url === '/') {
      log('index', req.url)
      res.write(index())
      return res.end()
    }
    if (req.url === '/sse') {
      log('sse', req.url)
      res.writeHead(200, {
        Connection: 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache'
      })

      const handle = setInterval(() => {
        res.write('event: message\n')
        res.write(`data: ${JSON.stringify({ time: new Date().toISOString(), data })}\n`)
        res.write('\n\n')
      }, 1000)

      return res.on('close', () => {
        clearInterval(handle)
        try { res.end() } catch (_) {}
        log('sse connection closed')
      })
    }
    if (req.url === '/favicon.ico') return res.end()
    if (/^\/\w+/.test(req.url)) {
      log('asin url', req.url)
      return res.end()
    }

    log('⛔️  [server] unhandled', req.url)

    res.end()
  }
}

function read (filepath, defaultValue = '') {
  try {
    return fs.readFileSync(filepath)
  } catch (err) {
    return defaultValue
  }
}

function index () {
  const filepath = path.join(__dirname, 'index.html')
  return read(filepath)
}
