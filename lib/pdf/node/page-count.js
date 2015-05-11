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
  var updateRequired = false

  if (this.number !== cursor.pageCount) {
    this.number = cursor.pageCount
    var width  = this.word.width
    var height = this.word.height
    this.word.word = String(cursor.pageCount)
    return this.word.width !== width || this.word.height !== height
  }

  return updateRequired || WordNode.prototype.mustUpdate.call(this, cursor)
}
