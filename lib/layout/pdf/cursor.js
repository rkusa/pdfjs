'use strict'

var PageBreakNode = require('../pdf/nodes/pagebreak')

var CursorFactory = module.exports = function(style) {
  var padding       = style.padding || 0
  var paddingLeft   = style.paddingLeft   || padding
  var paddingTop    = style.paddingTop    || padding
  var paddingRight  = style.paddingRight  || padding
  var paddingBottom = style.paddingBottom || padding

  this.top        = style.height - paddingTop
  this.bottom     = paddingBottom

  this.currentPage = 1
  this.pageCount   = 1

  this.nextPageBreakId = 1
  this.validPageBreakId = null

  this.force = true

  this.x = paddingLeft
  this.y = this.top
}

CursorFactory.prototype.create = function(w) {
  var self = this

  return {
    get width() {
      return w
    },
    get x() {
      return self.x
    },
    set x(val) {
      self.x = val
    },
    get y() {
      return self.y
    },
    set y(val) {
      self.y = val
    },
    get force() {
      return self.force
    },
    set force(val) {
      self.force = val
    },
    get currentPage() {
      return self.currentPage
    },
    get pageCount() {
      return self.pageCount
    },
    setPage: function(page) {
      return self.page = page
    },
    mustBreak: function(node) {
      return (node.y - node.height) < self.bottom && !node.allowBreak
    },
    create: function(narrow) {
      return self.create(narrow || w)
    },
    reset: this.reset.bind(this),
    pageBreak: this.pageBreak.bind(this),
  }
}

CursorFactory.prototype.reset = function() {
  this.force = false
  this.y     = this.top

  this.currentPage = 1
  this.validPageBreakId = null
}

CursorFactory.prototype.pageBreak = function(pageBreak) {
  if (!pageBreak) {
    pageBreak = new PageBreakNode(this.nextPageBreakId++)
    pageBreak.page = this.currentPage
  } else {
    if (this.validPageBreakId && pageBreak.id < this.validPageBreakId) {
      return null
    }

    this.validPageBreakId = pageBreak.id
  }

  if (++this.currentPage > this.pageCount) {
    this.pageCount++
  }

  this.y = this.top

  return pageBreak
}
