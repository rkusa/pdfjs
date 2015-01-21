'use strict'

var DocumentNode = module.exports = function(doc) {
  DocumentNode.super_.call(this)

  this.type = 'DocumentNode'
  this.allowBreak = true

  this.doc      = doc
  this.style    = doc.style

  this.children = this.doc.children.map(function(child) {
    return child.createNode(this)
  }, this)

  this.headers  = []
  this.footers  = []
}

require('../utils').inherits(DocumentNode, require('./base'))

// Object.defineProperties(DocumentNode.prototype, {
//   afterBreakHeight: {
//     enumerable: true,
//     get: function() {
//       return this.header ? this.header.height : 0
//     }
//   }
// })

// DocumentNode.prototype._compute = function(cursor) {
//   this.x = cursor.x
//   this.y = cursor.y

//   this.width  = 0
//   this.height = 0
// }

// DocumentNode.prototype.afterBreak = function(doc, parent) {
//   console.log('AFTER BREAK')
//   if (this.header) {
//     doc._build(this.header, { parent: parent, node: this })
//   }
// }


DocumentNode.prototype.begin = function(doc, parent) {
  var currentPage = doc.pages.kids.length
  var header = this.headers[currentPage]
  if (header) {
    doc._build(header, { parent: parent, node: this })
  }
}

DocumentNode.prototype.end = function(doc, parent) {
  var currentPage = doc.pages.kids.length
  var footer = this.footers[currentPage]
  if (footer) {
    doc._build(footer, { parent: parent, node: this })
  }
}
