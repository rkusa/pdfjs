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

var PageBreakNode = require('./pagebreak')

DocumentNode.prototype.calculate = function() {
  this.width  = this.document.style.width
  this.height = this.document.style.height

  this.paddingLeft   = this.document.style.paddingLeft || this.document.style.padding || 0
  this.paddingTop    = (this.document.style.paddingTop || this.document.style.padding || 0)
  this.paddingRight  = (this.document.style.paddingRight || this.document.style.padding || 0)
  this.paddingBottom = (this.document.style.paddingBottom || this.document.style.padding || 0)

  var threshold = 50

  var offset = this.document.style.height
    - this.paddingTop * 2
    - this.paddingBottom

  var cursor = {
    x:      this.paddingLeft,
    y:      this.height - this.paddingTop,
    width:  this.width - this.paddingLeft - this.paddingRight,
    top:    this.height - this.paddingTop,
    bottom: this.paddingBottom,
    offset: 0,
    currentPage: 1,
    pageCount:  1,
    force: true,

    pageBreakId: 1,
    validId: null,

    pageBreak: function(pageBreak) {
      if (!pageBreak) {
        pageBreak = new PageBreakNode(this.pageBreakId++)
        pageBreak.page = this.currentPage
      } else {
        if (this.validId && pageBreak.id < this.validId) {
          return false
        }

        this.validId = pageBreak.id
      }

      if (++this.currentPage > this.pageCount) {
        this.pageCount++
      }

      this.y = this.top

      return pageBreak
    }
  }

  while (!this._compile(cursor)) {
    console.log('IT')
    cursor.force = false
    cursor.y = cursor.top
    cursor.currentPage = 1
    cursor.validId = null

    if (--threshold === 0) {
      throw new Error('Endless rendering?')
      break
    }
  }
}
