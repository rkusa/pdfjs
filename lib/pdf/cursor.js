'use strict'

var Page = function(nr, header, footer, afterBreak) {
  this.nr         = nr
  this.header     = header
  this.footer     = footer
  this.afterBreak = afterBreak

  this.top = this.bottom = 0
}

Page.prototype.setup = function(cursor) {
  var style = cursor.style
  var top = this.top = cursor.y = style.height - style.paddingTop

  cursor.y -= cursor.offset || 0
  var y = cursor.y

  var x = cursor.x
  cursor.x = style.paddingLeft

  var shift = style.paddingTop

  if (this.header) {
    this.header.compute(cursor)
    this.top -= this.header.height
    shift += this.header.height
  }

  if (this.afterBreak && this.afterBreak.length) {
    this.afterBreak.forEach(function(node) {
      cursor.x = node.x.val
      node.compute(cursor)
      this.top -= node.height
      shift += node.height
    }, this)
  }

  if (this.nr > 1) {
    if (this.header) {
      this.header.shift(shift * -1)
    }

    if (this.afterBreak && this.afterBreak.length) {
      this.afterBreak.forEach(function(node) {
        node.shift(shift * -1)
      }, this)
    }
  }

  this.bottom = style.paddingBottom
  if (this.footer) {
    cursor.y = y
    cursor.x = style.paddingLeft

    this.footer.compute(cursor)
    this.bottom += this.footer.height

    var offset = top - this.bottom
    if (this.nr > 1) {
      offset += shift * -1
    }
    this.footer.shift(offset)
  }

  cursor.x = x
}

var CursorFactory = module.exports = function(doc) {
  this.doc         = doc
  this.style       = doc.style
  this.header      = doc.doc._header
  this.footer      = doc.doc._footer
  this.afterBreak  = []

  this.innerWidth  = this.style.width - this.style.paddingLeft - this.style.paddingRight

  this.currentPage = 1
  this.pages       = []
  this.pageBreaks  = []
  this.addPage(doc)

  this.nextPageBreakId  = 1
  this.validBreaks = Object.create(null)

  this.reset()
  this.force = true

  this.x = this.style.paddingLeft
  this.y = this.top
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

CursorFactory.prototype.create = function(w, h) {
  if (!w) {
    w = this.innerWidth
  }

  var cutAt = h ? this.y - h : undefined

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
    get right() {
      return self.style.width - self.style.paddingRight
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
      if (node.type === 'ForceBreakNode' && !node.valid) {
        node.valid = false
        return true
      }

      if (node.allowBreak) {
        return false
      }

      var offset = self.offset
      var mustBreak = (node.y.val - node.height) + offset < self.bottom
      if (!mustBreak) {
        return false
      }

      if (node.height > this.pageHeight) {
        return false
      }

      return true
    },
    isVisible: function(node) {
      return !cutAt || node.y.val - node.height >= cutAt
    },
    create: function(width, height) {
      return self.create(width || w, height)
    },
    reset: this.reset.bind(this),
    pageBreak: this.pageBreak.bind(this),
    applyBreak: this.applyBreak.bind(this),
    beforeContent: function(node) {
      if (node.afterBreak) {
        self.afterBreak.push(node.afterBreak)
      }

      var cursor = node.beforeContent(this)
      return cursor
    },
    afterContent: function(node) {
      if (node.afterBreak) {
        self.afterBreak.pop()
      }

      node.afterContent(this)
    }
  }
}

CursorFactory.prototype.reset = function() {
  this.force  = false
  this.y      = this.style.height
  this.offset = 0

  this.currentPage = 1
  this.visitedBreaks = Object.create(null)
  this.highestVisitedBreak = 0
}

CursorFactory.prototype.addPage = function(parent) {
  var page = new Page(
    this.currentPage,
    this.header && this.header.clone().createNode(),
    this.footer && this.footer.clone().createNode(),
    (this.afterBreak[this.afterBreak.length - 1] || [])
      .filter(function(child) {
        return child.valid(parent)
      })
      .map(function(child) {
        return child.clone()
      })
  )

  this.pages.push(page)

  page.setup(this.create())

  if (this.currentPage > 1) {
    var offset = this.top - this.style.height
    this.offset += offset
    this.pageBreaks[this.currentPage - 1].offset += offset
  }

  this.doc.headers[this.currentPage] = page.header
  this.doc.footers[this.currentPage] = page.footer
  this.doc.afterBreaks[this.currentPage] = page.afterBreak
}

CursorFactory.prototype.applyBreak = function(pageBreak) {
  this.offset += pageBreak.offset
  this.currentPage++
}

CursorFactory.prototype.pageBreak = function(pageBreak, parent, cause) {
  if (!pageBreak) {
    var offset = this.style.height - this.y - this.offset
    this.offset += offset

    if (this.currentPage in this.pageBreaks && this.visitedBreaks[this.pageBreaks[this.currentPage].id] === true) {
      pageBreak = this.pageBreaks[this.currentPage]
    } else {
      pageBreak = new parent.PageBreakType(this.nextPageBreakId++, offset, cause)
      pageBreak.page = this.currentPage
      this.pageBreaks[this.currentPage] = pageBreak
      this.validBreaks[pageBreak.id] = true
    }

    if (++this.currentPage > this.pages.length) {
      this.addPage(parent)
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
    if (pageBreak.cause) {
      pageBreak.cause.valid = true
    }
  }

  return pageBreak
}
