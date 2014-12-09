'use strict'

var WordNode = module.exports = function(word) {
  this.type = 'WordNode'
  this.allowBreak = false

  this.word = word
}

WordNode.prototype.compile = function(x, y) {
  this.x = x
  this.y = y

  this.width  = this.word.width
  this.height = this.word.height
}
