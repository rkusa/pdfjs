'use strict'

var DocumentNode = module.exports = function(doc) {
  DocumentNode.super_.call(this)

  this.type = 'DocumentNode'

  this.doc      = doc
  this.style    = doc.style
  this.children = this.doc.children.map(function(child) {
    return child.createNode()
  })
}

require('../utils').inherits(DocumentNode, require('./base'))

DocumentNode.prototype.mustUpdate = function(cursor) {
  return false
}

var Cursor = require('../cursor')

DocumentNode.prototype.calculate = function() {
  var cursor = new Cursor(this.doc)
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
