'use strict'

var Document = require('./element/document')
exports.createDocument = function(style) {
  return new Document(style)
}

var TTFFont = require('./element/font/ttf')
exports.createTTFFont = function(src) {
  return new TTFFont(src)
}
