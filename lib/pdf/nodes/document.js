'use strict'

var DocumentNode = module.exports = function(doc) {
  DocumentNode.super_.call(this)

  this.type = 'DocumentNode'
  this.allowBreak = true

  this.doc      = doc
  this.style    = doc.style
  this.children = this.doc.children.map(function(child) {
    return child.createNode()
  })
}

require('../utils').inherits(DocumentNode, require('./base'))

