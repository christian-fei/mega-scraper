module.exports = function normalizeUrl (url) {
  return (url || '').replace(/\//gi, '!').replace(/\?/, '_')
}
