'use strict'

var TextNode = module.exports = function(text) {
  this.type = 'TextNode'
  this.allowBreak = true

  this.text     = text
  this.style    = text.style
  this.children = []
}

var Line      = require('../element/line')
var LineBreak = require('../element/linebreak')

TextNode.prototype.compile = function(x, y, width) {
  var line  = new Line(this.text.style)
  var lines = [line]
  var spaceLeft = width

  this.text.children.forEach(function(word, i) {
    if (word instanceof LineBreak) {
      if (lines.length > 1) {
        lines[lines.length - 1].isLastLine = true
      }

      if (!line.length) {
        line.add(word)
      }

      lines.push(line = new Line(this.text.style))
      spaceLeft = width
      return
    }

    var wordWidth = word.width
    if (i > 0) wordWidth += word.spacing

    if (line.children.length > 0 && (spaceLeft - wordWidth) < 0) {
      lines.push(line = new Line(this.text.style))
      spaceLeft = width
    }

    spaceLeft -= wordWidth
    line.add(word)
  }, this)

  if (lines.length) {
    lines[lines.length - 1].isLastLine = true
  }

  this.x = x
  this.y = y
  this.width = width
  this.height = 0

  lines.forEach(function(line) {
    if (!line.children.length) {
      return
    }

    var l = line.compile(x, y, width)
    this.children.push(l)
    y -= l.height
    this.height += l.height
  }, this)
}

var WordNode = require('./word')

TextNode.prototype.begin = function(doc, pages, parent) {
  var lines = WordNode.prototype.buildStyle.call(this, doc, pages, parent)
  lines.unshift('BT')

  return lines
}

TextNode.prototype.end = function() {
  return 'ET'
}
