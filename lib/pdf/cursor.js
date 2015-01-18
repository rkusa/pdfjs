'use strict'

var PageBreakNode = require('../pdf/nodes/pagebreak')

var CursorFactory = module.exports = function(style) {
  this.style       = style
  this.top         = style.height - style.paddingTop
  this.bottom      = style.paddingBottom

  this.pageHeight  = this.top - this.bottom

  this.currentPage = 1
  this.pageCount   = 1
  this.pageBreaks  = []

  this.nextPageBreakId  = 1
  this.validPageBreakId = null

  this.force = true

  this.x = style.paddingLeft
  this.y = this.top

  this.offset = 0
  this.afterBreakOffset = 0
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
    get bottom() {
      return self.bottom
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
    set currentPage(val) {
      self.currentPage = val
    },
    get pageCount() {
      return self.pageCount
    },
    get offset() {
      return self.offset
    },
    set offset(val) {
      self.offset = val
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


        // node is going to contain a page break, i.e., add before break height
        // to bottom for further `mustBreak` calculations
        // self.bottom += beforeBreakHeight

        return false
      }

      return true
    },
    create: function(narrow) {
      return self.create(narrow || w)
    },
    reset: this.reset.bind(this),
    pageBreak: this.pageBreak.bind(this),
    applyBreak: this.applyBreak.bind(this),
    beforeContent: function(node) {
      self.afterBreakOffset += node.afterBreakHeight || 0
      var cursor = node.beforeContent(this)

      return cursor
    },
    afterContent: function(node) {
      node.afterContent(this)
      // self.afterBreakOffset -= node.afterBreakHeight || 0
    }
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

CursorFactory.prototype.applyBreak = function(pageBreak) {
  this.offset += pageBreak.offset

  if (++this.currentPage > this.pageCount) {
    this.pageCount++
  }
}

CursorFactory.prototype.pageBreak = function(pageBreak, parent) {
  if (!pageBreak) {
    var offset = this.top - (this.y + this.offset)
    this.offset += offset

    if (this.currentPage in this.pageBreaks) {
      pageBreak = this.pageBreaks[this.currentPage]
    } else {
      if (this.afterBreakOffset) {
        offset -= this.afterBreakOffset
        this.afterBreakOffset = 0
      }

      pageBreak = new parent.pageBreakType(this.nextPageBreakId++, offset)
      pageBreak.page = this.currentPage
      this.pageBreaks[this.currentPage] = pageBreak
    }

    if (++this.currentPage > this.pageCount) {
      this.pageCount++
    }
  } else {
    if (this.validPageBreakId && pageBreak.id < this.validPageBreakId) {
      return null
    }

    this.validPageBreakId = pageBreak.id

    // this.bottom = this.style.paddingBottom
  }

  return pageBreak
}
