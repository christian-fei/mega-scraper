const log = require('debug')('mega-scraper:storage:html-cache')
const { extractAsin, extractPage } = require('../url-logics/amazon')
const { normalizeUrl } = require('../url-logics/url')
const path = require('path')
const fs = require('fs')
const basepath = process.cwd()
log('basepath', basepath)

module.exports = {
  htmlPathFor,
  htmlDirFor,
  jsonPathFor,
  jsonDirFor,
  saveFor,
  saveHtmlFor,
  saveJSONFor,
  readHtmlFor,
  readJSONFor,
  readFor
}

function pathFor (url, type) {
  const asin = extractAsin(url)
  const pageNumber = extractPage(url)
  if (asin && pageNumber) {
    return path.resolve(basepath, type, 'amazon', asin, `${asin}-${pageNumber}.${type}`)
  }
  return path.resolve(basepath, type, 'page', `${normalizeUrl(url)}.${type}`)
}
function dirFor (url, type) {
  const asin = extractAsin(url)
  if (asin) {
    return path.resolve(basepath, type, 'amazon', asin)
  }
  return path.resolve(basepath, type, 'page')
}

function htmlPathFor (url) {
  return pathFor(url, 'html')
}

function htmlDirFor (url) {
  return dirFor(url, 'html')
}
function jsonPathFor (url) {
  return pathFor(url, 'json')
}

function jsonDirFor (url) {
  return dirFor(url, 'json')
}

function saveFor (url, { html, json }) {
  html && saveHtmlFor(url, html)
  json && saveJSONFor(url, json)
}

function saveHtmlFor (url, content) {
  const htmlPath = htmlPathFor(url)
  const htmlDir = htmlDirFor(url)
  log(`saving ${htmlPath}`)
  try { fs.mkdirSync(htmlDir, { recursive: true }) } catch (err) { }
  try {
    fs.writeFileSync(htmlPath, content, { encoding: 'utf8' })
    log(`saved ${htmlPath}`)
  } catch (err) { log(`failed to save ${htmlPath}`, err.message) }
}

function saveJSONFor (url, content) {
  const jsonPath = jsonPathFor(url)
  const jsonDir = jsonDirFor(url)
  log(`saving ${jsonPath}`)
  try { fs.mkdirSync(jsonDir, { recursive: true }) } catch (err) { }
  try {
    fs.writeFileSync(jsonPath, JSON.stringify(content), { encoding: 'utf8' })
    log(`saved ${jsonPath}`)
  } catch (err) { log(`failed to save ${jsonPath}`, err.message) }
}

function readFor (url) {
  const html = readHtmlFor(url)
  const json = readJSONFor(url)
  return { html, json }
}

function readHtmlFor (url) {
  const htmlPath = htmlPathFor(url)
  log(`reading ${htmlPath}`)
  try {
    return fs.readFileSync(htmlPath, { encoding: 'utf8' }).toString('utf-8')
  } catch (err) { log(`failed to read ${htmlPath}`, err.message) }
}
function readJSONFor (url) {
  const jsonPath = jsonPathFor(url)
  log(`reading ${jsonPath}`)
  try {
    const content = fs.readFileSync(jsonPath, { encoding: 'utf8' }).toString('utf-8')
    return JSON.parse(content)
  } catch (err) { log(`failed to read ${jsonPath}`, err.message) }
}
