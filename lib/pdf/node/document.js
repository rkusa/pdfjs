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

  this.headers     = []
  this.footers     = []
  this.afterBreaks = []
}

require('../utils').inherits(DocumentNode, require('./base'))

DocumentNode.prototype.begin = function(doc, parent) {
  var currentPage = doc.pages.kids.length
  var header = this.headers[currentPage]
  if (header) {
    doc._build(header, { parent: parent, node: this })
  }
}

DocumentNode.prototype.end = function(doc, parent) {
  var currentPage = doc.pages.kids.length

  var afterBreak = this.afterBreaks[currentPage]
  if (afterBreak) {
    afterBreak.forEach(function(child) {
      doc._build(child, { parent: parent, node: this })
    }, this)
  }

  var currentPage = doc.pages.kids.length
  var footer = this.footers[currentPage]
  if (footer) {
    doc._build(footer, { parent: parent, node: this })
  }
}
