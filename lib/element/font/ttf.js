'use strict'

var TTFFont = require('ttfjs')
var utils   = require('../../pdf/utils')
var uuid    = require('node-uuid')

var Font = module.exports = function(src) {
  this.uuid = uuid.v4()
  this.ttf  = new TTFFont(utils.toArrayBuffer(src))
}

Font.prototype.subset = function() {
  return this.ttf.subset({ remap: true, trimNames: true })
}

Font.prototype.stringWidth = function(string, size) {
  return this.ttf.stringWidth(string, size)
}

Font.prototype.lineHeight = function(size, includeGap) {
  return this.ttf.lineHeight(size, includeGap)
}

Font.prototype.lineDescent = function(size) {
  return this.ttf.lineDescent(size)
}
