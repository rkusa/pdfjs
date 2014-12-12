'use strict'

var DocumentNode = module.exports = function(document) {
  DocumentNode.super_.call(this)

  this.type = 'DocumentNode'

  this.document = document
  this.children = this.document.children.map(function(child) {
    return child.createNode()
  })
}

require('../utils').inherits(DocumentNode, require('./base'))

DocumentNode.prototype.mustUpdate = function(cursor) {
  return false
}

var Cursor = require('../pdf/cursor')

DocumentNode.prototype.calculate = function() {
  var cursor = new Cursor(this.document)
  var threshold = 50

  while (!this._compile(cursor)) {
    console.log('IT')
    cursor.reset()

    if (--threshold === 0) {
      throw new Error('Endless rendering?')
      break
    }
  }
}
