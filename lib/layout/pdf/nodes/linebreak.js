'use strict'

var LineBreakNode = module.exports = function(linebreak) {
  LineBreakNode.super_.call(this)

  this.type = 'LineBreakNode'
  this.allowBreak = true

  this.linebreak = linebreak
  this.children  = []
  this.isEmptyLine = false
}

require('../utils').inherits(LineBreakNode, require('./base'))

LineBreakNode.prototype.updateCursor = function(cursor) {
  if (this.isEmptyLine) {
    cursor.y -= this.height
  }
}

LineBreakNode.prototype._compute = function(x, y) {
  this.x = x
  this.y = y

  this.width  = 0
  this.height = this.linebreak.height
}
