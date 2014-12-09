'use strict'

var LineBreakNode = module.exports = function(linebreak) {
  this.type = 'LineBreakNode'
  this.allowBreak = true

  this.linebreak = linebreak
  this.children  = []
}

LineBreakNode.prototype.compile = function(x, y) {
  this.x = x
  this.y = y

  this.width  = 0
  this.height = this.linebreak.height
}
