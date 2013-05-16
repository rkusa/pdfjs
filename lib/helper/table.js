var Text   = require('./text')
  , Vector = require('./vector')
  
var defaults = {
  size: 11,
  padding: expandPadding([5, 8]),
  borderWidth: 1
}

var Table = module.exports = function(page, x, y, options, definition) {
  if (typeof options === 'function') {
    definition = options
    options = {}
  }
  
  this.page    = page
  this.x       = x
  this.y       = y
  this.options = options
  
  merge(defaults, this.options)
  if (!this.options.font) this.options.font = page.document.font('Helvetica')

  this.rows = []
  
  definition.call(this, this)
  this._draw()
}

Table.prototype.tr = function(options, definition) {
  this.rows.push(new Row(this, options, definition))
}

Table.prototype._draw = function() {
  var columns = [], self = this
  var highestRowWidth = Math.max.apply(Math, this.rows.map(function(row) {
    return row.cells.map(function(cell, i) {
      if (columns[i] === undefined || cell.width > columns[i])
        columns[i] = cell.width
      return cell.width
    }).reduce(function(lhs, rhs) { return lhs + rhs }, 0)
  }))
  
  var maxWidth = this.page.document.width - this.page.document.padding.right - this.x
  if (highestRowWidth > maxWidth) {
    var widthPerCell = maxWidth / this.columns.length
      , toShrink = []
      , unused = 0
    
    for (var i = 0, len = this.columns.length; i < len; ++i) {
      if (this.columns[i] < widthPerCell) unused += widthPerCell - this.columns[i]
      else toShrink.push(i)
    }
    
    widthPerCell += unused / toShrink.length
    toShrink.forEach(function(i) {
      columns[i] = widthPerCell
    })
  }
  
  var minWidth = this.options.width || maxWidth
  if (minWidth && highestRowWidth < minWidth) {
    var widthPerCell = minWidth / this.columns.length
      , toExtend = []
      , used = 0
    
    for (var i = 0, len = this.columns.length; i < len; ++i) {
      if (this.columns[i] > widthPerCell) used += this.columns[i] - widthPerCell
      else toExtend.push(i)
    }
    
    widthPerCell -= used / toExtend.length
    toExtend.forEach(function(i) {
      columns[i] = widthPerCell
    })
  }
  
  this.rows.forEach(function(row) {
    row.cells.forEach(function(cell, column) {
      var width = columns[column]
      if (cell.options.colspan > 1) {
        for (var i = column + 1, len = column + cell.options.colspan; i < len; ++i) {
          width += columns[i] || 0
        }
      }

      cell.innerWidth = width - (cell.width - cell.innerWidth)
      cell.text = new Text(self.page, cell.text, merge(cell.options, {
        width: cell.innerWidth
      }))
      cell.innerHeight *= cell.text.lines.length
    })
  })
  
  for (var i = 0; i < this.rows.length; ++i) {
    this.rows[i]._draw(i)
  }
}

var Row = function(table, options, definition) {
  if (typeof options === 'function') {
    definition = options
    options = {}
  }
  
  this.table   = table
  this.options = merge(table.options, options)
  
  this.cells = []

  this.splitAbove = false
  this.splitBelow = false
  
  definition.call(this, this)
}

Row.prototype.td = function(text, options) {
  var cell = new Cell(this, text, options)
  this.cells.push(cell)
  return cell
}

Row.prototype._draw = function(pos) {
  var self = this
    , x = this.table.x
  var height = Math.max.apply(Math, this.cells.map(function(cell) {
    return cell.height
  }))
  
  // the row does not fit on to the current page
  if ((this.table.y - height) < this.table.page.document.padding.bottom) {
    // the row fits into one page
    if (this.table.y <= this.table.page.document.padding.bottom  // no space remaining
     || height <= this.table.page.document.innerHeight) {        // does not fit at all
      // page break
      var page = this.table.page = this.table.page.break()
      this.table.y = page.cursor
      if (this.options.header === true && !this.splitAbove)
        this.table.rows[0]._draw(0)
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
            var marginTop = cell.options.padding.top + cell.options.borderWidth
                          + cell.options.font.lineGap / 1000 * cell.options.size
            var linesPerPage = Math.floor((self.table.y - self.table.page.document.padding.bottom - marginTop) / cell.text.lineHeight)

            text = cell.text.lines.splice(linesPerPage - 1, cell.text.lines.length - linesPerPage).map(function(line) {
              return line.line.join(' ')
            }).join(' ')
            
            cell.innerHeight = cell.text.lineHeight * cell.text.lines.length
          }
          var newCell = that.td(text, cell.options)
          newCell.innerWidth = cell.innerWidth
          newCell.text = new Text(self.table.page, newCell.text, merge(newCell.options, {
            width: newCell.innerWidth
          }))
          newCell.innerHeight *= newCell.text.lines.length
          
          that.splitAbove = self.splitBelow = true
        })
      })
      
      // insert row into table
      this.table.rows.splice(pos + 1, 0, row)
      
      // update current rows height
      height = this.table.y - this.table.page.document.padding.bottom
    }
  }
  
  if (pos > 0) this.y += this.options.borderWidth
  
  this.cells.forEach(function(cell, column) {
    cell._draw(x, height, column)
    x += cell.width 
  })
  
  self.table.y -= height
}

var Cell = function(row, text, options) {
  if (!options) options = {}
  
  this.row     = row
  this.text    = text
  this.options = merge(row.options, options)
  
  this.innerWidth  = Text.width(this.text, this.options.font, this.options.size)
  this.innerHeight = this.options.font.lineHeight(this.options.size, true)
}

Cell.prototype._draw = function(x, height, column) {
  var table = this.row.table
  
  if (this.options.borderWidth > 0) {
    var halfBorderWidth = this.options.borderWidth / 2
    // border bottom
    if (!this.row.splitBelow) {
      Vector.drawLine(table.page, this.options.borderWidth,
                      [x - halfBorderWidth, table.y - height + halfBorderWidth],
                      [x + this.width, table.y - height + halfBorderWidth])
    }
    // border top
    if (!this.row.splitAbove) {
      Vector.drawLine(table.page, this.options.borderWidth,
                      [x - halfBorderWidth, table.y],
                      [x + this.width, table.y])
    }
    
    var downTo = table.y - height
    if (downTo < table.page.document.padding.bottom)
      downTo = table.page.document.padding.bottom
    // border right
    Vector.drawLine(table.page, this.options.borderWidth,
                    [x + this.width - halfBorderWidth, downTo],
                    [x + this.width - halfBorderWidth, table.y - halfBorderWidth])
    // border left
    Vector.drawLine(table.page, this.options.borderWidth,
                    [x, table.y + halfBorderWidth],
                    [x, downTo])
  }
  
  // reset page and add font again in case of recent page break
  table.page.addFont(this.text.font)
  this.text.page = table.page
  
  // print text
  this.text.print(
    x + this.options.padding.left + this.options.borderWidth,
    table.y - this.options.padding.top - this.options.borderWidth
  )
}

Object.defineProperties(Cell.prototype, {
  width: {
    enumerable: true,
    get: function() {
      return this.options.padding.left + this.innerWidth + this.options.padding.right
          + 2 * this.options.borderWidth
    }
  },
  height: {
    enumerable: true,
    get: function() {
      return this.options.padding.top + this.innerHeight + this.options.padding.bottom
           + 2 * this.options.borderWidth
           + this.options.font.lineGap / 1000 * this.options.size
    }
  }
})

// Helper Functions

var defaultPadding = { top: 0, right: 0, bottom: 0, left: 0 }
function expandPadding(padding) {
  if (typeof padding === 'object') {
    if (Array.isArray(padding)) {
      if (padding.length === 2)
        return { top: padding[0], right: padding[1], bottom: padding[0], left: padding[1] }
      else
        return { top: padding[0], right: padding[1], bottom: padding[2], left: padding[3] }
    } else {
      return merge(defaultPadding, padding)
    }
  } else {
    return { top: padding, right: padding, bottom: padding, left: padding }    
  }
}

function merge(from, into) {
  for (var key in from) {
    if (!into.hasOwnProperty(key))
      into[key] = from[key]
  }
  return into
}