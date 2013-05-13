var Text = require('../text')
var defaults = {
  size: 11,
  padding: [5, 5, 5, 5],
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
  
  this.maxWidth = page.document.width - page.document.padding[1] - this.x
  
  definition.call(this, this)
  draw.call(this)
}

Table.prototype.tr = function(options, definition) {
  this.rows.push(new Row(this, options, definition))
}

var Row = function(table, options, definition) {
  if (typeof options === 'function') {
    definition = options
    options = {}
  }
  
  this.table   = table
  this.options = merge(table.options, options)
  
  this.cells = []
  
  definition.call(this, this)
}

Row.prototype.td = function(text, options) {
  this.cells.push(new Cell(this, text, options))
}

var Cell = function(row, text, options) {
  if (!options) options = {}
  
  this.row     = row
  this.text    = text
  this.options = merge(row.options, options)
  
  this.innerWidth  = Text.width(this.text, this.options.font, this.options.size)
  this.innerHeight = this.options.font.lineHeight(this.options.size, true)
}

Object.defineProperties(Cell.prototype, {
  width: {
    enumerable: true,
    get: function() {
      return this.options.padding[3] + this.innerWidth + this.options.padding[1]
          + 2 * this.options.borderWidth
    }
  },
  height: {
    enumerable: true,
    get: function() {
      return this.options.padding[0] + this.innerHeight + this.options.padding[2]
           + 2 * this.options.borderWidth
           + this.options.font.lineGap / 1000 * this.options.size
    }
  }
})

function draw() {
  var columns = []
  
  var highestRowWidth = Math.max.apply(Math, this.rows.map(function(row) {
    return row.cells.map(function(cell, i) {
      if (columns[i] === undefined || cell.width > columns[i])
        columns[i] = cell.width
      return cell.width
    }).reduce(function(lhs, rhs) { return lhs + rhs }, 0)
  }))
  
  var self = this
  if (highestRowWidth > this.maxWidth) {
    var widthPerCell = this.maxWidth / columns.length
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
  
  this.rows.forEach(function(row) {
    row.cells.forEach(function(cell, column) {
      cell.innerWidth = columns[column] - (cell.width - cell.innerWidth)
      cell.text = new Text(self.page, cell.text, merge(cell.options, {
        width: cell.innerWidth
      }))
      cell.innerHeight *= cell.text.lines.length
    })
  })
  
  this.rows.forEach(function(row, n) {
    drawRow.call(self, row, n, columns)
  })
}

function drawRow(row, n, columns) {
  var self = this
    , x = this.x
  var height = Math.max.apply(Math, row.cells.map(function(cell) {
    return cell.height
  }))
  
  // page break
  if ((this.y - height) < this.page.document.padding[2]) {
    this.y = this.page.document.height - this.page.document.padding[0]
    this.page = this.page.document.addPage()
    if (self.options.header === true)
      drawRow.call(this, self.rows[0], 0, columns)
  }
  
  if (n > 0) this.y += row.options.borderWidth
  
  row.cells.forEach(function(cell, pos) {
    if (cell.options.borderWidth > 0) {
      var halfBorderWidth = cell.options.borderWidth / 2
      // border bottom
      drawLine.call(self, cell.options.borderWidth,
                    [x - halfBorderWidth, self.y - height + halfBorderWidth],
                    [x + columns[pos], self.y - height + halfBorderWidth])
      // border right
      drawLine.call(self, cell.options.borderWidth,
                    [x + columns[pos] - halfBorderWidth, self.y - height],
                    [x + columns[pos] - halfBorderWidth, self.y - halfBorderWidth])
      // border top
      drawLine.call(self, cell.options.borderWidth,
                    [x - halfBorderWidth, self.y],
                    [x + columns[pos], self.y])
      // border left
      drawLine.call(self, cell.options.borderWidth,
                    [x, self.y + halfBorderWidth],
                    [x, self.y - height])
    }

    self.page.addFont(cell.text.font)
    cell.text.page = self.page
    cell.text.print(
      x + cell.options.padding[3] + cell.options.borderWidth,
      self.y - cell.options.padding[0] - cell.options.borderWidth
    )
    
    x += columns[pos] - cell.options.borderWidth
  })
  
  self.y -= height
}

function drawLine(width, from, to) {
  this.page.contents.writeLine('0.00 0.00 0.00 RG')
  this.page.contents.writeLine(width + ' w')
  this.page.contents.writeLine(from[0] + ' ' + from[1] + ' m ' + to[0] + ' ' + to[1] + ' l S')
  this.page.contents.writeLine('')
}

function expandPadding(padding) {
  if (!Array.isArray(padding)) return [padding, padding, padding, padding]
  if (padding.length === 2) return [padding[0], padding[1], padding[0], padding[1]]
  return padding
}

function merge(from, into) {
  for (var key in from) {
    if (!into.hasOwnProperty(key))
      into[key] = from[key]
  }
  return into
}