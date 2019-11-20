module.exports = {
  normalizeUrl
}

function normalizeUrl (url) {
  return (url || '').replace(/\//gi, '!').replace(/\?/, '_')
}
