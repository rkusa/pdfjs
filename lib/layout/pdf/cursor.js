'use strict'

var PageBreakNode = require('../pdf/nodes/pagebreak')

var CursorFactory = module.exports = function(style) {
  this.style       = style
  this.top         = style.height - style.paddingTop
  this.bottom      = style.paddingBottom

  this.pageHeight  = this.top - this.bottom

  this.currentPage = 1
  this.pageCount   = 1

  this.nextPageBreakId  = 1
  this.validPageBreakId = null

  this.force = true

  this.x = style.paddingLeft
  this.y = this.top

  this.offset = 0
  this.pageBreakOffset = 0
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
    get pageHeight() {
      return self.top - self.bottom
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
      if (node.allowBreak) {
        return false
      }

      var mustBreak = node.y - node.height < self.bottom - self.offset
      if (!mustBreak) {
        return false
      }

      if (node.height > self.pageHeight) {
        var beforeBreakHeight = node.beforeBreakHeight || 0

        // if (node.y - node.height < self.bottom + beforeBreakHeight - self.offset) {
        //   return true
        // }

        self.bottom += node.beforeBreakHeight || 0
        self.pageBreakOffset = node.afterBreakHeight || 0

        return false
      }

      return true
    },
    create: function(narrow) {
      return self.create(narrow || w)
    },
    reset: this.reset.bind(this),
    pageBreak: this.pageBreak.bind(this),
  }
}

CursorFactory.prototype.reset = function() {
  this.force  = false
  this.y      = this.top
  this.offset = 0
  this.bottom = this.style.paddingBottom

  this.currentPage = 1
  this.validPageBreakId = null
}

CursorFactory.prototype.pageBreak = function(pageBreak) {
  if (!pageBreak) {
    this.offset += this.top - (this.y + this.offset)

    pageBreak = new PageBreakNode(this.nextPageBreakId++, this.offset)
    pageBreak.page = this.currentPage
  } else {
    if (this.validPageBreakId && pageBreak.id < this.validPageBreakId) {
      return null
    }

    pageBreak.offset -= this.pageBreakOffset
    this.offset += pageBreak.offset
    this.validPageBreakId = pageBreak.id
  }

  if (++this.currentPage > this.pageCount) {
    this.pageCount++
  }

  this.y = this.top
  this.pageBreakOffset = 0

  return pageBreak
}
