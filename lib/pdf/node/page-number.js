'use strict'

var utils = require('../utils')
var Word      = require('../../element/word')
var WordNode  = require('./word')

var PageNumber = module.exports = function(pageNumber) {
  PageNumber.super_.call(this, pageNumber)

  this.type = 'PageNumber'

  this.number = 0
}

utils.inherits(PageNumber, WordNode)

PageNumber.prototype.mustUpdate = function(cursor) {
  var updateRequired = false

  if (this.number !== cursor.currentPage) {
    this.number = cursor.currentPage
    var width  = this.word.width
    var height = this.word.height
    this.word.word = String(cursor.currentPage)
    updateRequired = this.word.width !== width || this.word.height !== height
  }

  return updateRequired || WordNode.prototype.mustUpdate.call(this, cursor)
}
