'use strict'

var Word = require('./word')

var PageNumber = module.exports = function(style) {
  Word.call(this, '0', style)
  Word.super_.call(this, require('../pdf/node/page-number'))
}

require('../pdf/utils').inherits(PageNumber, Word)

PageNumber.prototype.clone = function() {
  var clone = new PageNumber(this.style)
  clone.style = this.style
  clone.children = [clone].concat(this.children.slice(1).map(function(child) {
    return child.clone()
  }))
  return clone
}
