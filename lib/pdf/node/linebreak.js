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

LineBreakNode.prototype.beforeContent = function(cursor) {
  if (this.isEmptyLine) {
    cursor.y -= this.height
  }

  return cursor
}

LineBreakNode.prototype._compute = function(cursor) {
  this.x.val = cursor.x
  this.y.val = cursor.y

  this.width  = 0
  this.height = this.linebreak.height
}
