'use strict'

var Page = function(header, footer) {
  this.header = header
  this.footer = footer

  this.top = this.bottom = 0
}

Page.prototype.setup = function(cursor) {
  var style = cursor.style
  var top = this.top = cursor.y = style.height - style.paddingTop

  cursor.y -= cursor.offset || 0
  var y = cursor.y

  var x = cursor.x
  cursor.x = style.paddingLeft

  if (this.header) {
    this.header.compute(cursor)
    this.top -= this.header.height
  }

  this.bottom = style.paddingBottom
  if (this.footer) {
    cursor.y = y
    cursor.x = style.paddingLeft

    this.footer.compute(cursor)
    this.bottom += this.footer.height

    var offset = top - this.bottom
    this.footer.shift(offset)
  }

  cursor.x = x
}

var CursorFactory = module.exports = function(doc) {
  this.doc         = doc
  this.style       = doc.style
  this.header      = doc.doc._header
  this.footer      = doc.doc._footer

  this.innerWidth  = this.style.width - this.style.paddingLeft - this.style.paddingRight

  this.currentPage = 1
  this.pages       = []
  this.pageBreaks  = []
  this.addPage()

  this.nextPageBreakId  = 1
  this.validBreaks = Object.create(null)
  this.visitedBreaks = Object.create(null)
  this.highestVisitedBreak = 0

  this.force = true

  this.x = this.style.paddingLeft
  this.y = this.top

  this.offset = 0
  this.afterBreakOffset = 0
}

Object.defineProperties(CursorFactory.prototype, {
  top: {
    enumerable: true,
    get: function() {
      return this.pages[this.currentPage - 1].top
    }
  },
  bottom: {
    enumerable: true,
    get: function() { return this.pages[this.currentPage - 1].bottom }
  }
})

CursorFactory.prototype.create = function(w) {
  if (!w) {
    w = this.innerWidth
  }

  var self = this

  return {
    get style() {
      return self.style
    },
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
    get pageCount() {
      return self.pages.length
    },
    get offset() {
      return self.offset
    },
    set offset(val) {
      self.offset = val
    },
    setPage: function(page) {
      if (page < 1) {
        return 1
      }
      return self.currentPage = page
    },
    mustBreak: function(node) {
      if (node.allowBreak) {
        return false
      }

      var mustBreak = node.y - node.height < self.bottom - self.offset
      if (!mustBreak) {
        return false
      }

      if (node.height > this.pageHeight) {
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
    }
  }
}

CursorFactory.prototype.reset = function() {
  this.force  = false
  this.y      = this.top
  this.offset = 0

  this.currentPage = 1
  this.visitedBreaks = Object.create(null)
  this.highestVisitedBreak = 0
}

CursorFactory.prototype.addPage = function() {
  var page = new Page(
    this.header && this.header.createNode(),
    this.footer && this.footer.createNode()
  )

  this.pages.push(page)

  page.setup(this.create())

  this.doc.headers[this.currentPage] = page.header
  this.doc.footers[this.currentPage] = page.footer
}

CursorFactory.prototype.applyBreak = function(pageBreak) {
  this.offset += pageBreak.offset

  if (++this.currentPage > this.pages.length) {
    this.addPage()
  }
}

CursorFactory.prototype.pageBreak = function(pageBreak, parent) {
  if (!pageBreak) {
    var offset = this.top - (this.y + this.offset)
    this.offset += offset

    if (this.currentPage in this.pageBreaks && this.visitedBreaks[this.pageBreaks[this.currentPage].id] === true) {
      pageBreak = this.pageBreaks[this.currentPage]
    } else {
      if (this.afterBreakOffset) {
        offset -= this.afterBreakOffset
        this.afterBreakOffset = 0
      }

      pageBreak = new parent.PageBreakType(this.nextPageBreakId++, offset)
      pageBreak.page = this.currentPage
      this.pageBreaks[this.currentPage] = pageBreak
      this.validBreaks[pageBreak.id] = true
    }

    if (++this.currentPage > this.pages.length) {
      this.addPage()
    }
  } else {
    var isValid = this.validBreaks[pageBreak.id] === true
    var isVisited = this.visitedBreaks[pageBreak.id] === true
    var possibleInvalid = this.highestVisitedBreak > pageBreak.id
    if (!isValid || (!isVisited && possibleInvalid)) {
      this.validBreaks = this.visitedBreaks
      delete this.pageBreaks[this.currentPage]
      return null
    }

    this.visitedBreaks[pageBreak.id] = true
    this.highestVisitedBreak = Math.max(this.highestVisitedBreak, pageBreak.id)

    // this.bottom = this.style.paddingBottom
  }

  return pageBreak
}
