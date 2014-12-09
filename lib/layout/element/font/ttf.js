'use strict'

var TTFFont = require('ttfjs')

var Font = module.exports = function(src) {
  // GLOBAL[('Buffer').toString()] is used instead of Buffer to trick browserify
  // to not load a Buffer polyfill just for instance testing. The `toString()` part
  // is used to trick eslint to not throw
  var isArrayBuffer = src instanceof ArrayBuffer
  var isBuffer = typeof GLOBAL !== 'undefined' && src instanceof GLOBAL[('Buffer').toString()]
  if (!isArrayBuffer && !isBuffer) {
    throw new TypeError('Font must be provided as either Buffer or Arraybuffer.')
  }

  this.ttf = new TTFFont(src)
}

Font.prototype.subset = function() {
  return this.ttf.subset()
}

Font.prototype.stringWidth = function(string, size) {
  return this.ttf.stringWidth(string, size)
}

Font.prototype.lineHeight = function(size, includeGap) {
  return this.ttf.lineHeight(size, includeGap)
}