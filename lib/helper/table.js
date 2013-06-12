var Text   = require('./text')
  , Vector = require('./vector')
  
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

var Table = module.exports = function(page, left, options, definition) {
  if (typeof options === 'function') {
    definition = options
    options = {}
  }
  
  this.page    = page
  this.x       = left
  this.options = options
  
  mergeOption(defaults, this.options)

  if (!this.options.font)
    this.options.font = page.document.font('Helvetica', this.options)
  
  this.rows = []
  
  definition.call(this, this)
  this.prepareMetrics()
}

Object.defineProperty(Table.prototype, 'height', {
  enumerable: true,
  get: function() {
    return this.rows.map(function(row) {
      return Math.max.apply(Math, row.cells.map(function(cell) {
        return cell.height
      }))
    }).reduce(function(lhs, rhs) {
      return lhs + rhs
    }, 0)
  }
})

Table.prototype.tr = function(options, definition) {
  this.rows.push(new Row(this, options, definition))
}

Table.prototype.print = function(y) {
  this.y = y
  for (var i = 0; i < this.rows.length; ++i) {
    this.rows[i].print(i)
  }
  return this.y
}

Table.prototype.prepareMetrics = function() {
  var columns = [], self = this
  var highestRowWidth = Math.max.apply(Math, this.rows.map(function(row) {
    return row.cells.map(function(cell, i) {
      if (columns[i] === undefined || (cell.width > columns[i] && !(cell.options.colspan > 1)))
        columns[i] = cell.width
      return cell.width
    }).reduce(function(lhs, rhs) { return lhs + rhs }, 0)
  }))
  
  var maxWidth = this.page.document.width - this.page.padding.right - this.x
  if (highestRowWidth > maxWidth) {
    var widthPerCell = maxWidth / columns.length
      , toShrink = []
      , unused = 0
    
    for (var i = 0, len = columns.length; i < len; ++i) {
      if (columns[i] < widthPerCell) unused += widthPerCell - columns[i]
      else toShrink.push(i)
    }
    
    widthPerCell += unused / toShrink.length
    toShrink.forEach(function(i) {
      columns[i] = widthPerCell
    })
  }
  
  var minWidth = this.options.width || maxWidth
  if (minWidth && highestRowWidth < minWidth) {
    var widthPerCell = minWidth / columns.length
      , toExtend = []
      , used = 0
    
    for (var i = 0, len = columns.length; i < len; ++i) {
      if (columns[i] < widthPerCell) toExtend.push(i)
      used += columns[i]
    }
    
    var add = (minWidth - used) / toExtend.length
    toExtend.forEach(function(i) {
      columns[i] += add
    })
  }
  
  this.rows.forEach(function(row) {
    var column = 0
    row.cells.forEach(function(cell) {
      var width = columns[column]
      if (cell.options.colspan > 1) {
        for (var i = column + 1, len = column + cell.options.colspan; i < len; ++i) {
          width += columns[i] || 0
        }
        column += cell.options.colspan - 1
      }

      cell.innerWidth = width - (cell.width - cell.innerWidth)
  
      cell.text = new Text(self.page, 0, cell.text, mergeOption(cell.options, {
        width: cell.innerWidth
      }))
      cell.innerHeight *= cell.text.lines.length
      
      column++
    })
  })
}

var Row = function(table, options, definition) {
  if (typeof options === 'function') {
    definition = options
    options = {}
  }
  
  this.table   = table
  this.options = mergeOption(table.options, options)
  this.options.font = this.table.page.document.font('Helvetica', this.options)
  
  this.cells = []

  this.splitAbove = false
  this.splitBelow = false
  
  definition.call(this, this)
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

Row.prototype.td = function(text, options) {
  var cell = new Cell(this, text, options)
  this.cells.push(cell)
  return cell
}

Row.prototype.print = function(pos) {
  var self = this
    , x = this.table.x
  var height = Math.max.apply(Math, this.cells.map(function(cell) {
    return cell.height
  }))
  
  // the row does not fit on to the current page
  if ((this.table.y - height) < this.table.page.padding.bottom) {
    // the row fits into one page
    if (this.table.y <= this.table.page.padding.bottom  // no space remaining
     || height <= this.table.page.document.innerHeight) {        // does not fit at all
      // page break
      var page = this.table.page = this.table.page.break()
      this.table.y = page.cursor
      if (this.options.header === true && !this.splitAbove)
        this.table.rows[0].print(0)
    }
    
    // the row has do be splitted to fit into one page
    if (height > this.table.page.document.innerHeight) {
      // create new row
      var row = new Row(this.table, this.options, function() {
        var that = this
        // split each cell
        self.cells.forEach(function(cell) {
          var text = ''
          if (cell.height > self.table.page.document.innerHeight) {
            var marginTop = cell.options.padding.top + cell.borderTopWidth
                          + cell.options.font.lineGap / 1000 * cell.options.size
            var linesPerPage = Math.floor((self.table.y - self.table.page.padding.bottom - marginTop) / cell.text.lineHeight)

            text = cell.text.lines.splice(linesPerPage - 1, cell.text.lines.length - linesPerPage).map(function(line) {
              return line.line.join(' ')
            }).join(' ')
            
            cell.innerHeight = cell.text.lineHeight * cell.text.lines.length
          }
          var newCell = that.td(text, cell.options)
          newCell.innerWidth = cell.innerWidth
          newCell.text = new Text(self.table.page, 0, newCell.text, mergeOption(newCell.options, {
            width: newCell.innerWidth
          }))
          newCell.innerHeight *= newCell.text.lines.length
          
          that.splitAbove = self.splitBelow = true
        })
      })
      
      // insert row into table
      this.table.rows.splice(pos + 1, 0, row)
      
      // update current rows height
      height = this.table.y - this.table.page.padding.bottom
    }
  }
  
  // if (pos > 0) this.y += this.options.borderWidth.top
  
  this.cells.forEach(function(cell, column) {
    cell.print(x, height, column)
    x += cell.width 
  })
  
  self.table.y -= height
}

var Cell = function(row, text, options) {
  if (!options) options = {}
  
  this.row     = row
  this.text    = text
  this.options = mergeOption(row.options, options)
  this.options.font = this.row.table.page.document.font('Helvetica', this.options)

  this.innerWidth  = Text.width(this.text, this.options.font, this.options.size)
  this.innerHeight = this.options.font.lineHeight(this.options.size, true)
  
  this.isFirstColumn = this.row.cells.length === 0
  this.isLastColumn  = true
  if (!this.isFirstColumn)
    this.row.cells[this.row.cells.length - 1].isLastColumn = false
}

Cell.prototype.print = function(x, height, column) {
  var table = this.row.table

  var border
  // border bottom
  if (this.borderBottomWidth > 0 && !this.row.splitBelow) {
    Vector.drawLine(table.page, border = this.borderBottomWidth,
                    [x - border / 2, table.y - height + border / 2],
                    [x + this.width, table.y - height + border / 2])
  }
    // border top
  if (this.borderTopWidth > 0 && !this.row.splitAbove) {
    Vector.drawLine(table.page, border = this.borderTopWidth,
                    [x - border / 2, table.y],
                    [x + this.width, table.y])
  }
    
  var downTo = table.y - height
  if (downTo < table.page.padding.bottom)
    downTo = table.page.padding.bottom
    
  // border right
  if (this.borderRightWidth > 0) {
    Vector.drawLine(table.page, border = this.borderRightWidth,
                    [x + this.width - border / 2, downTo],
                    [x + this.width - border / 2, table.y - border / 2])
  }
  
  // border left
  if (this.borderLeftWidth > 0) {
    Vector.drawLine(table.page, border = this.borderLeftWidth,
                    [x, table.y + border / 2],
                    [x, downTo])
  }
  
  // reset page and add font again in case of recent page break
  table.page.addFont(this.text.font)
  this.text.page = table.page
  
  // print text
  this.text.print(
    table.y - this.options.padding.top - this.borderTopWidth,
    x + this.options.padding.left + this.borderLeftWidth
  )
}

Object.defineProperties(Cell.prototype, {
  width: {
    enumerable: true,
    get: function() {
      return this.borderLeftWidth + this.options.padding.left
           + this.innerWidth
           + this.options.padding.right + this.borderRightWidth
    }
  },
  height: {
    enumerable: true,
    get: function() {
      return this.borderTopWidth + this.options.padding.top
           + this.options.font.lineGap / 1000 * this.options.size
           + this.innerHeight
           + this.options.padding.bottom + this.borderBottomWidth
    }
  }
})
  
Object.defineProperties(Cell.prototype, {
  borderTopWidth: {
    enumerable: true,
    get: function() {
      var borderWidth = this.options.borderWidth
      return borderWidth.top || (
        !this.row.isFirstRow ? borderWidth.horizontal || borderWidth.inside || 0
                             : 0
      )
    }
  },
  borderRightWidth: {
    enumerable: true,
    get: function() {
      var borderWidth = this.options.borderWidth
      return borderWidth.right || (
        !this.isLastColumn ? borderWidth.vertical || borderWidth.inside || 0
                           : 0
      )
    }
  },
  borderBottomWidth: {
    enumerable: true,
    get: function() {
      var borderWidth = this.options.borderWidth
      return borderWidth.bottom || (
        !this.row.isLastRow ? borderWidth.horizontal || borderWidth.inside || 0
                            : 0
      )
    }
  },
  borderLeftWidth: {
    enumerable: true,
    get: function() {
      var borderWidth = this.options.borderWidth
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