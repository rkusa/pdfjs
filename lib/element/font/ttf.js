'use strict'

var TTFFont = require('ttfjs')
var utils   = require('../../pdf/utils')

var Font = module.exports = function(src) {
  this.ttf = new TTFFont(utils.toArrayBuffer(src))
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