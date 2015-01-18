'use strict'

var WordNode = module.exports = function(word) {
  WordNode.super_.call(this)

  this.type = 'WordNode'

  this.word    = word
  this.style   = word.style
  this.isFirst = false
  this.isLast  = false
}

require('../utils').inherits(WordNode, require('./base'))

WordNode.prototype.beforeContent = function(cursor) {
  if (this.isLast) {
    cursor.y -= this.height
  }

  return cursor
}

WordNode.prototype._compute = function(cursor) {
  this.y = cursor.y
}

WordNode.prototype.setBoundingBox = function(x, y, width, height) {
  this.x = x
  this.y = y

  this.width  = width
  this.height = height
}

var PDFString = require('../object/string')
var TTFFont   = require('../object/font/ttf')
var utils     = require('../utils')

WordNode.prototype.buildStyle = function(doc, parent) {
  var font = doc.mapping.get(this.style.font)
  if (!font) {
    font = new TTFFont(doc.fonts.length + 1, this.style.font)
    doc.mapping.set(this.style.font, font)
    doc.fonts.push(font)
  }

  if (!doc.currentPage.fonts.has(font.alias)) {
    doc.currentPage.fonts.add(font.alias, font.toReference())
  }

  if (parent.node.style !== this.style) {
    doc.Tf(font.alias, this.style.fontSize)
    doc.rg.apply(doc, utils.colorToRgb(this.style.color))
  }
}

WordNode.prototype.render = function(doc, parent) {
  this.buildStyle(doc, parent)

  var font = doc.mapping.get(this.style.font)

  if (this.isFirst) {
    doc.Tm(1, 0, 0, 1, this.x, this.y - this.height)
  }

  var str = font.encode(this.word.toString())
  doc.Tj((new PDFString(str)).toHexString())

  if (!this.isLast) {
    doc.Td(this.width, 0)
  }
}
