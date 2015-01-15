'use strict'

var utils = require('../utils')

var TableNode = module.exports = function(table) {
  TableNode.super_.call(this)

  this.type = 'TableNode'
  this.allowBreak = false

  this.table    = table
  this.style    = table.style
  this.children = this.table.children.map(function(child) {
    return child.createNode()
  })

  if (this.children.length) {
    this.children[0].isFirst = true
  }
}

utils.inherits(TableNode, require('./base'))

Object.defineProperties(TableNode.prototype, {
  height: {
    enumerable: true,
    get: function() {
      return this.children.map(function(child) { return child.height })
                          .reduce(function(lhs, rhs) { return lhs + rhs }, 0)
    }
  },
  afterBreakHeight: {
    enumerable: true,
    get: function() {
      var height = 0
      for (var i = 0; i < this.style.headerRows; ++i) {
        var row = this.children[i]
        if (!row) {
          break
        }

        height += row.height
      }
      return height
    }
  }
})

TableNode.prototype.mustUpdate = function(cursor) {
  for (var i = 0, len = this.children.length; i < len; ++i) {
    if (this.children[i].mustUpdate(cursor)) {
      return true
    }
  }

  return false
}

TableNode.prototype._compute = function(cursor) {
  this.x = cursor.x
  this.y = cursor.y

  this.width = utils.resolveWidth(this.style.width, cursor.width)

  switch (this.style.tableLayout) {
    case 'fixed':
      this.widths = this.style.widths.map(function(width) {
        return utils.resolveWidth(width, this.width)
      }, this)

      break
    default:
      throw new Error('Table layout `' + this.style.tableLayout + '` not implemented')
  }

  this.children.forEach(function(row, j) {
    row.width = this.width

    // unify border
    row.children.forEach(function(cell, i) {
      if (j > 0) {
        var onTop = this.children[j - 1].children[i]
        var horizontalWidth, horizontalColor

        if (cell.style.borderTopWidth > onTop.style.borderBottomWidth) {
          horizontalWidth = cell.style.borderTopWidth / 2
          horizontalColor = cell.style.borderTopColor
        } else {
          horizontalWidth = onTop.style.borderBottomWidth / 2
          horizontalColor = onTop.style.borderBottomColor
        }

        onTop.style = onTop.style.merge({
          borderBottomWidth: horizontalWidth,
          borderBottomColor: horizontalColor
        })

        cell.style = cell.style.merge({
          borderTopWidth: horizontalWidth,
          borderTopColor: horizontalColor
        })
      }

      if (i > 0) {
        var onLeft = row.children[i - 1]
        var verticalWidth, verticalColor

        if (cell.style.borderLeftWidth > onLeft.style.borderRightWidth) {
          verticalWidth = cell.style.borderLeftWidth / 2
          verticalColor = cell.style.borderLeftColor
        } else {
          verticalWidth = onLeft.style.borderRightWidth / 2
          verticalColor = onLeft.style.borderRightColor
        }

        onLeft.style = onLeft.style.merge({
          borderRightWidth: verticalWidth,
          borderRightColor: verticalColor
        })

        cell.style = cell.style.merge({
          borderLeftWidth: verticalWidth,
          borderLeftColor: verticalColor
        })
      }
    }, this)

    // set width
    row.children.forEach(function(cell, i) {
      cell.width = (this.widths[i] || 0)
                 - cell.style.borderLeftWidth - cell.style.paddingLeft
                 - cell.style.paddingRight - cell.style.borderRightWidth
    }, this)
  }, this)
}

TableNode.prototype.afterBreak = function(doc, parent) {
  for (var i = 0; i < this.style.headerRows; ++i) {
    var row = this.children[i]
    if (!row) {
      break
    }

    doc._build(row, { parent: parent, node: this })
  }
}
