'use strict'

var Line = module.exports = function(style) {
  Line.super_.call(this, require('../ast/line'))

  this.style      = style
  this.children   = []
  this.isLastLine = false
}

require('../utils').inherits(Line, require('./base'))

Line.prototype.add = function(word) {
  this.children.push(word)
}
