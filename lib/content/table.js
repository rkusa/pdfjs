'use strict'

module.exports = function(opts, definition) {
  var table = new Table(this, opts, definition)
  this.contents.push(table)
  return table
}

var utils = require('../utils')

var defaults = {
  size: 12,
  padding: {
    top: 5, bottom: 5,
    left: 8, right: 8
  },
  borderWidth: {
    top: null, bottom: null,
    left: null, right: null
  }
}

var Table = function(doc, opts, definition) {
  if (typeof opts === 'function') {
    definition = opts
    opts = {}
  }

  this.doc  = doc.doc || doc
  this.opts = opts || {}

  mergeOption(defaults, this.opts)

  this.rows = []
  this._beforeBreak = this._afterBreak = null

  if (definition) definition.call(this, this)
}

Table.prototype.tr = function(opts, definition) {
  var row = new Row(this, opts, definition)
  this.rows.push(row)
  return row
}

Table.prototype.beforeBreak = function(opts, definition) {
  return this._beforeBreak = new Row(this, opts, definition)
}

Table.prototype.afterBreak = function(opts, definition) {
  return this._afterBreak = new Row(this, opts, definition)
}

Table.prototype.render = function(page, width) {
  var columns = []
  var maxWidth = width, minWidth = width

  if (Array.isArray(this.opts.width)) {
    var widths = this.opts.width

    var absolute = 0
    widths.forEach(function(width, i) {
      if (width.toString().indexOf('%') > -1)
        return
      absolute += (columns[i] = parseFloat(width))
    })

    var remaining = maxWidth - absolute
    widths.forEach(function(width, i) {
      if (width.toString().indexOf('%') > -1) {
        columns[i] = utils.resolveWidth(width, remaining)
      }
    })
  } else {
    if ('width' in this.opts)
      minWidth = utils.resolveWidth(widths, maxWidth)

    var highestRowWidth = Math.max.apply(Math, this.rows.map(function(row) {
      return row.cells.map(function(cell, i) {
        if (columns[i] === undefined || (cell.width > columns[i] && !(cell.opts.colspan > 1)))
          columns[i] = cell.width
        return cell.width
      }).reduce(function(lhs, rhs) { return lhs + rhs }, 0)
    }))

    if (highestRowWidth > maxWidth) {
      var widthPerCell = maxWidth / columns.length
      var toShrink = []
      var unused = 0

      for (var i = 0, len = columns.length; i < len; ++i) {
        if (columns[i] < widthPerCell) unused += widthPerCell - columns[i]
        else toShrink.push(i)
      }

      widthPerCell += unused / toShrink.length
      toShrink.forEach(function(i) {
        columns[i] = widthPerCell
      })
    }

    if (minWidth && highestRowWidth < minWidth) {
      var widthPerCell = minWidth / columns.length
      var toExtend = []
      var used = 0

      for (var i = 0, len = columns.length; i < len; ++i) {
        if (columns[i] < widthPerCell) toExtend.push(i)
        used += columns[i]
      }

      var add = (minWidth - used) / toExtend.length
      toExtend.forEach(function(i) {
        columns[i] += add
      })
    }
  }

  var left = page.cursor.x, transactions = []
  for (var i = 0; i < this.rows.length; ++i) {
    var y = page.cursor.y
    var row = this.rows[i]

    var transaction
    if (this.opts.header && i === 1) {
      // if headers are enabled, use the one transaction for the header and
      // first row
      transaction = transactions[0]
    } else {
      transaction = this.doc.startTransaction()
    }

    transactions[i] = transaction

    var height = row.render(page, columns, { table: { row: i }, doc: this.doc })

    if (height === false) {
      page.cursor.x = left
      page.cursor.y = y

      transaction.rollback()
      row.allowBreak = true
      --i

      // if headers enabled and we've reverted the first row, we have reverted
      // the header row, too, i.e., render the header row again
      if (this.opts.header && i === 0) {
        --i
      }

      // before break
      if (this._beforeBreak) {
        while (height === false && i > 0) {
          var attempt = this.doc.startTransaction()
          height = this._beforeBreak.render(page, columns, { table: { row: i }, doc: this.doc })
          if (height === false) {
            page.cursor.x = left
            page.cursor.y = y

            attempt.rollback()
            this.rows[i].allowBreak = false
            transactions[i--].rollback()
            this.rows[i].allowBreak = true
          } else {
            attempt.commit()
          }
        }
      }

      // break
      page = this.doc.pagebreak()
      y = page.cursor.y
      height = 0
      var context = { table: { row: i }, doc: this.doc }

      // after break
      if (this._afterBreak) {
        page.cursor.x = left
        height += this._afterBreak.render(page, columns, context)
        page.cursor.y = y - height
      }

      // header
      if (this.opts.header === true && i > 0) {
        page.cursor.x = left
        height += this.rows[0].render(page, columns, context)
      }
    } else {
      transaction.commit()
    }

    page.cursor.x = left
    page.cursor.y = y - height
  }
}

var Row = function(table, opts, definition) {
  if (typeof opts === 'function') {
    definition = opts
    opts = {}
  }

  this.table = table
  this.doc   = table.doc
  this.opts  = mergeOption(table.opts, opts || {})

  this.cells = []

  this.allowBreak = false

  if (definition) definition.call(this, this)
}

Object.defineProperties(Row.prototype, {
  isFirstRow: {
    enumerable: true,
    get: function() {
      return this.table.rows.indexOf(this) === 0
    }
  },
  isLastRow: {
    enumerable: true,
    get: function() {
      return this.table.rows.indexOf(this) === this.table.rows.length - 1
    }
  }
})

Row.prototype.td = function(text, opts) {
  if (typeof text === 'object') {
    var fn = opts
    opts = text
    text = fn
  }
  var cell = new Cell(this, text, opts)
  this.cells.push(cell)
  return cell
}

Row.prototype.render = function(page, columns, context) {
  var y = page.cursor.y
  var heights = []
  var borders = []
  var column = 0

  function addBorder(x, y, width) {
    borders.push(function(height) {
      cell.drawBorder(page, x, y, width, height)
    })
  }

  for (var i = 0, len = this.cells.length; i < len; ++i) {
    var cell = this.cells[i]

    var width = columns[column++]
    if (cell.opts.colspan > 1) {
      for (var j = column, count = column + cell.opts.colspan - 1; j < count; ++j) {
        width += columns[j] || 0
      }
      column += cell.opts.colspan - 1
    }

    addBorder(page.cursor.x, page.cursor.y, width)

    var paddingLeft  = cell.borderLeftWidth + cell.opts.padding.left
    var paddingRight = cell.opts.padding.right + cell.borderRightWidth
    var innerWidth   = width - paddingLeft - paddingRight
    page.cursor.x += paddingLeft
    page.cursor.y -= cell.borderTopWidth + cell.opts.padding.top // padding top
    var pageIndex = this.doc.pages.pages.indexOf(page)
    cell.render(page, innerWidth, context) // below: padding bottom
    var height = pageIndex + 1 < this.doc.pages.count
        ? y - this.doc.padding.bottom
        : y - page.cursor.y + cell.opts.padding.bottom + cell.borderBottomWidth
    for (var j = pageIndex + 1, count = this.doc.pages.count; j < count; ++j) {
      height += this.doc.height - this.doc.padding.top - this.doc.pages.pages[j].cursor.y
    }
    heights.push(height)
    page.cursor.y = y
    page.cursor.x += innerWidth + paddingRight

    if (this.doc.cursor !== page && !this.allowBreak) {
      return false
    }
  }

  var height = Math.max.apply(Math, heights)
  borders.forEach(function(border) {
    border(height)
  })

  return height
}

var Fragment = require('../fragment')

var Cell = function(row, text, opts) {
  if (!opts) opts = {}

  this.row  = row
  this.doc  = row.doc
  this.opts = mergeOption(row.opts, opts)

  if (text instanceof Fragment) {
    this.content = text
    this.contents = text.prepared
  } else {
    this.content = new Fragment(this.doc)
    if (typeof text === 'function') {
      text.call(this.content, this.content)
    } else {
      this.content.text(text, this.opts)
    }
  }

  this.innerWidth  = this.content.maxWidth
  this.innerHeight = this.content.minHeight

  this.isFirstColumn = this.row.cells.length === 0
  this.isLastColumn  = true
  if (!this.isFirstColumn)
    this.row.cells[this.row.cells.length - 1].isLastColumn = false
}

Cell.prototype.render = function(page, width, context) {
  this.content.render(page, width, context)
}

Cell.prototype.drawBorder = function(page, x, y, width, height, splitBelow, splitAbove) {
  if (y - this.doc.padding.bottom < height) {
    var spaceLeft = height - y + this.doc.padding.bottom
    var pageIndex = this.doc.pages.pages.indexOf(page)
    this.drawBorder(page, x, y, width, y - this.doc.padding.bottom, true, false)
    while (spaceLeft > 0) {
      page = this.doc.pages.pages[++pageIndex]
      if (spaceLeft > this.doc.innerHeight) {
        height = this.doc.innerHeight
        this.drawBorder(page, this.doc.padding.left, this.doc.height - this.doc.padding.top, width, height, true, true)
      } else {
        height = spaceLeft // this.doc.height - this.doc.padding.top - page.cursor.y
        this.drawBorder(page, this.doc.padding.left, this.doc.height - this.doc.padding.top, width, height, false, true)
      }
      spaceLeft -= height
    }
    return
  }


  var border
  // border bottom
  if (this.borderBottomWidth > 0 && !splitBelow) {
    drawLine(page, border = this.borderBottomWidth,
             [x - border / 2, y - height + border / 2],
             [x + width, y - height + border / 2])
  }
    // border top
  if (this.borderTopWidth > 0 && !splitAbove) {
    drawLine(page, border = this.borderTopWidth,
             [x - border / 2, y],
             [x + width, y])
  }

  var downTo = y - height
  if (downTo < this.doc.padding.bottom)
    downTo = this.doc.padding.bottom

  // border right
  if (this.borderRightWidth > 0) {
    drawLine(page, border = this.borderRightWidth,
             [x + width - border / 2, downTo],
             [x + width - border / 2, y - border / 2])
  }

  // border left
  if (this.borderLeftWidth > 0) {
    drawLine(page, border = this.borderLeftWidth,
             [x, y + border / 2],
             [x, downTo])
  }
}

Object.defineProperties(Cell.prototype, {
  width: {
    enumerable: true,
    get: function() {
      return this.borderLeftWidth + this.opts.padding.left
           + this.innerWidth
           + this.opts.padding.right + this.borderRightWidth
    }
  },
  height: {
    enumerable: true,
    get: function() {
      return this.borderTopWidth + this.opts.padding.top
           // + this.opts.font.lineGap / 1000 * this.opts.size
           + this.innerHeight
           + this.opts.padding.bottom + this.borderBottomWidth
    }
  }
})

Object.defineProperties(Cell.prototype, {
  borderTopWidth: {
    enumerable: true,
    get: function() {
      var borderWidth = this.opts.borderWidth
      return borderWidth.top || (
        !this.row.isFirstRow ? borderWidth.horizontal || borderWidth.inside || 0
                             : 0
      )
    }
  },
  borderRightWidth: {
    enumerable: true,
    get: function() {
      var borderWidth = this.opts.borderWidth
      return borderWidth.right || (
        !this.isLastColumn ? borderWidth.vertical || borderWidth.inside || 0
                           : 0
      )
    }
  },
  borderBottomWidth: {
    enumerable: true,
    get: function() {
      var borderWidth = this.opts.borderWidth
      return borderWidth.bottom || (
        !this.row.isLastRow ? borderWidth.horizontal || borderWidth.inside || 0
                            : 0
      )
    }
  },
  borderLeftWidth: {
    enumerable: true,
    get: function() {
      var borderWidth = this.opts.borderWidth
      return borderWidth.left || (
        !this.isFirstColumn ? borderWidth.vertical || borderWidth.inside || 0
                            : 0
      )
    }
  }
})

// Helper Functions

function mergeOption(from, into) {
  for (var key in from) {
    if (key === 'width') continue
    var val = into[key]
    if (val === undefined || val === null)
      into[key] = from[key]
    else {
      switch(key) {
      case 'padding':
        val = expandOption(val, { top: 0, right: 0, bottom: 0, left: 0 })
        break
      case 'borderWidth':
        val = expandOption(val, { top: null, right: null, bottom: null, left: null,
                                  inside: null, horizontal: null, vertical: null })
        break
      default:
        continue
      }
      if (typeof val === 'object')
        into[key] = mergeOption(from[key], val)
    }
  }
  return into
}

function expandOption(option, defaults) {
  if (typeof option === 'object') {
    if (Array.isArray(option)) {
      if (option.length === 2)
        return { top: option[0], right: option[1], bottom: option[0], left: option[1] }
      else
        return { top: option[0], right: option[1], bottom: option[2], left: option[3] }
    } else {
      return mergeOption(defaults, option)
    }
  } else {
    return { top: option, right: option, bottom: option, left: option }
  }
}

function drawLine(page, width, from, to) {
  page.contents.writeLine('0 0 0 RG')
  page.contents.writeLine(width + ' w')
  page.contents.writeLine(from[0] + ' ' + from[1] + ' m ' + to[0] + ' ' + to[1] + ' l S')
  page.contents.writeLine('')
}
