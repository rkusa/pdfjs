'use strict'

var WordNode = module.exports = function(word) {
  this.type = 'WordNode'
  this.allowBreak = false

  this.word  = word
  this.style = word.style
}

WordNode.prototype.compile = function(x, y, width) {
  this.x = x
  this.y = y

  this.width  = width
  this.height = this.word.height
}

var PDFString = require('../pdf/objects/string')
var TTFFont   = require('../pdf/font/ttf')
var utils     = require('../pdf/utils')

WordNode.prototype.buildStyle = function(doc, pages, parent) {
  var font = doc.fonts.get(this.style.font)
  if (!font) {
    font = new TTFFont(doc.subsets.length + 1, this.style.font)
    doc.fonts.set(this.style.font, font)
    doc.subsets.push(font)
  }

  if (!pages.current.fonts.has(font.alias)) {
    pages.current.fonts.add(font.alias, font.toReference())
  }

  var lines = []

  if (parent.node.style !== this.style) {
    lines.push([font.alias, this.style.fontSize, 'Tf'].join(' '))
    lines.push(utils.colorToRgb(this.style.color).join(' ') + ' rg')
  }

  return lines
}

WordNode.prototype.build = function(doc, pages, parent) {
  var lines = this.buildStyle(doc, pages, parent)

  var font = doc.fonts.get(this.style.font)

  var str = font.encode(this.word.toString())
  lines.push((new PDFString(str)).toHexString() + ' Tj')
  lines.push(this.width + ' 0 Td')

  return lines
}
