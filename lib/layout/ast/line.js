'use strict'

var LineNode = module.exports = function(line) {
  this.type = 'LineNode'
  this.allowBreak = false

  this.line     = line
  this.children = []
}

LineNode.prototype.compile = function(x, y, width) {
  this.width  = width
  this.height = Math.max.apply(Math, this.line.children.map(function(word) {
    return word.height
  }))
  this.x      = x
  this.y      = y - this.height

  var emptySpace = width - this.line.children.map(function(word, i) {
    return word.width + (i > 0 ? word.spacing : 0)
  }).reduce(function(lhs, rhs) {
    return lhs + rhs
  }, 0)

  var count = this.line.children.length
  var spacing = 0

  // alignement
  switch (this.line.style.textAlign) {
    case 'right':
      x += emptySpace
      break
    case 'center':
      x += width / 2 - (width - emptySpace) / 2
      break
    case 'justify':
      if (this.line.isLastLine && emptySpace / width > .2) {
        break
      }
      spacing = emptySpace / (count - 1)
      break
  }

  this.line.children.forEach(function(word, i) {
    if (i > 0) {
      x += word.spacing + spacing
    }
    x = word.style.round(x)

    var w = word.compile(x, y - this.height)
    this.children.push(w)
    x += w.width
  }, this)
}