'use strict'

var TextNode = module.exports = function(text) {
  this.type = 'TextNode'
  this.allowBreak = true

  this.text     = text
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

TextNode.prototype.breakAt = function(y) {
  for (var i = 0, len = this.children.length; i < len; ++i) {
    console.log(this.children[i].y, y)
    if (this.children[i].y < y) {
      break
    }
  }

  if (--i < 0) {
    console.log('FAIL')
    // TODO
    return
  }

  var node = new TextNode(this.text)
  console.log(i, this.children.length)
  node.y = this.children[i].y
  node.children = this.children.splice(i, this.children.length - i)

  var height = 0
  node.children.forEach(function(line) {
    height += line.height
  }, this)

  node.height = height
  this.height -= height

  console.log('BASD', this.height, height, this.children.length)

  return node
}
