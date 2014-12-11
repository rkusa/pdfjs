'use strict'

var TextNode = module.exports = function(text) {
  this.type = 'TextNode'
  this.allowBreak = true

  this.text     = text
  this.style    = text.style
  this.children = this.text.children.map(function(child) {
    return child.createNode()
  })
}

var LineBreakNode = require('./linebreak')

TextNode.prototype.compile = function(x, y, width) {
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

    line[0].newLine = true

    line.forEach(function(word, i) {
      var width = word.word.width + word.word.spacing + spacing

      var w = word.compile(left, y - height, width)
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
    if (word instanceof LineBreakNode) {
      isLastLine = true

      if (line.length) {
        renderLine()
      } else {
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

TextNode.prototype.begin = function(doc, pages, parent) {
  var lines = WordNode.prototype.buildStyle.call(this, doc, pages, parent)
  lines.unshift('BT')

  return lines
}

TextNode.prototype.end = function() {
  return 'ET'
}
