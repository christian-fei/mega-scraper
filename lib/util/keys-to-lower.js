module.exports = function keysToLower (obj = {}) {
  return Object.keys(obj).reduce((acc, key) => Object.assign(acc, { [key.toLowerCase()]: obj[key] }), {})
}
