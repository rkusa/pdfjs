'use strict'

var TextNode = module.exports = function(text) {
  TextNode.super_.call(this)

  this.type = 'TextNode'
  this.allowBreak = true

  this.text     = text
  this.style    = text.style
  this.children = this.text.children.map(function(child) {
    return child.createNode()
  })
}

require('../utils').inherits(TextNode, require('./base'))

TextNode.prototype.mustUpdate = function(cursor) {
  for (var i = 0, len = this.children.length; i < len; ++i) {
    if (this.children[i].mustUpdate(cursor)) {
      return true
    }
  }

  return false
}

var LineBreakNode = require('./linebreak')

TextNode.prototype._compute = function(x, y, width) {
  this.x = x
  this.y = y
  this.width = width
  this.height = 0

  var line  = []
  var spaceLeft = width
  var isLastLine = false

  var self = this
  var renderLine = function() {
    if (!line.length) {
      return
    }

    var left = x

    var height = Math.max.apply(Math, line.map(function(word) {
      return word.word.height
    }))

    var emptySpace = width - line.map(function(word, i) {
      return word.word.width + (i > 0 ? word.word.spacing : 0)
    }).reduce(function(lhs, rhs) {
      return lhs + rhs
    }, 0)

    var count = line.length
    var spacing = 0

    // alignement
    switch (self.text.style.textAlign) {
      case 'right':
        x += emptySpace
        break
      case 'center':
        x += width / 2 - (width - emptySpace) / 2
        break
      case 'justify':
        if (isLastLine && emptySpace / width > .2) {
          break
        }
        spacing = emptySpace / (count - 1)
        break
    }

    line[0].isFirst = true
    line[line.length - 1].isLast = true

    line.forEach(function(word, i) {
      var width = word.word.width + word.word.spacing + spacing

      var w = word.setBoundingBox(left, y, width, height)
      left = self.text.style.round(left)
      left += width
    }, this)

    self.height += height
    y -= height

    line.length = 0
    spaceLeft = width
    isLastLine = false
  }

  this.children.forEach(function(word, i) {
    if (word.type === 'PageBreakNode') {
      return
    } else if (word.type === 'LineBreakNode') {
      isLastLine = true

      if (line.length) {
        renderLine()
      } else {
        word.isEmptyLine = true
        y -= word.linebreak.height
      }
      return
    }

    var wordWidth = word.word.width
    if (i > 0) wordWidth += word.word.spacing

    if (line.length > 0 && (spaceLeft - wordWidth) < 0) {
      renderLine()
    }

    spaceLeft -= wordWidth
    line.push(word)
  }, this)

  isLastLine = true
  renderLine()
}

var WordNode = require('./word')

TextNode.prototype.begin = function(doc, parent) {
  var lines = WordNode.prototype.buildStyle.call(this, doc, parent)
  lines.unshift('BT')

  return lines
}

TextNode.prototype.end = function() {
  return 'ET'
}
