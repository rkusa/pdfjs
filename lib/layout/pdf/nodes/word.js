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

WordNode.prototype.updateCursor = function(cursor) {
  if (this.isLast) {
    cursor.y -= this.height
  }
}

WordNode.prototype.compile = function(x, y) {
  this.y = y
}

WordNode.prototype.xyz = function(x, y, width, height) {
  this.x = x
  this.y = y

  this.width  = width
  this.height = height
}

var PDFString = require('../object/string')
var TTFFont   = require('../font/ttf')
var utils     = require('../utils')

WordNode.prototype.buildStyle = function(doc, parent) {
  var font = doc.fonts.get(this.style.font)
  if (!font) {
    font = new TTFFont(doc.subsets.length + 1, this.style.font)
    doc.fonts.set(this.style.font, font)
    doc.subsets.push(font)
  }

  if (!doc.currentPage.fonts.has(font.alias)) {
    doc.currentPage.fonts.add(font.alias, font.toReference())
  }

  var lines = []

  if (parent.node.style !== this.style) {
    lines.push([font.alias, this.style.fontSize, 'Tf'].join(' '))
    lines.push(utils.colorToRgb(this.style.color).join(' ') + ' rg')
  }

  return lines
}

WordNode.prototype.render = function(doc, parent) {
  var lines = this.buildStyle(doc, parent)

  var font = doc.fonts.get(this.style.font)

  if (this.isFirst) {
    lines.push('1 0 0 1 ' + this.x + ' ' + (this.y - this.height) + ' Tm')
  }

  var str = font.encode(this.word.toString())
  lines.push((new PDFString(str)).toHexString() + ' Tj')

  if (!this.isLast) {
    lines.push(this.width + ' 0 Td')
  }

  return lines
}
