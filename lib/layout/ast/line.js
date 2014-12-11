'use strict'

var LineNode = module.exports = function(line) {
  this.type = 'LineNode'
  this.allowBreak = false

  this.line     = line
  this.style    = line.style
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
    var width = word.width + word.spacing + spacing

    var w = word.compile(x, y - this.height, width)
    x = word.style.round(x)

    this.children.push(w)
    x += width
  }, this)
}

LineNode.prototype.begin = function() {
  return '1 0 0 1 ' + this.x + ' ' + this.y + ' Tm'
}
