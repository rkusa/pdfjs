'use strict'

var utils     = require('../utils')
var Word      = require('../../element/word')
var WordNode  = require('./word')

var PageCount = module.exports = function(pageCount) {
  PageCount.super_.call(this, pageCount)

  this.type = 'PageCount'

  this.number = 0
}

utils.inherits(PageCount, WordNode)

PageCount.prototype.mustUpdate = function(cursor) {
  if (this.number !== cursor.pageCount) {
    this.number = cursor.pageCount
    var width  = this.word.width
    var height = this.word.height
    this.word = new Word(String(cursor.pageCount), this.style)
    return this.word.width !== width || this.word.height !== height
  }

  return false
}
