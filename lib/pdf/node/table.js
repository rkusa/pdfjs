'use strict'

var utils = require('../utils')
var TablePageBreakNode = require('./table-pagebreak')
var ConditionalNode = require('./conditional')
var RowProxy = require('../proxy/row')

var TableNode = module.exports = function(table) {
  TableNode.super_.call(this)

  this.type = 'TableNode'
  this.allowBreak = true

  this.table    = table
  this.style    = table.style
  this.children = this.table.children.map(function(child) {
    return child.createNode()
  })

  if (this.children.length) {
    this.children[0].isFirst = true
  }

  this.beforeBreakChildren = table.beforeBreakChildren.map(function(child) {
    return new RowProxy(child)
  })
  this.PageBreakType = TablePageBreakNode.with(this.beforeBreakChildren)

  this.afterBreak = []

  if (this.style.headerRows > 0) {
    var self = this
    this.afterBreak.push(new ConditionalNode(
      this.children.slice(0, this.style.headerRows),
      function(parent) { return parent === self }
    ))
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
  this.x.val = cursor.x
  this.y.val = cursor.y

  this.width = utils.resolveWidth(this.style.width, cursor.width)

  switch (this.style.tableLayout) {
    case 'fixed':
      var spaceLeft = this.width

      this.widths = this.style.widths
      // absolute widths
      .map(function(width) {
        if (!utils.isRelative(width)) {
          width = parseFloat(width, 10)
          spaceLeft -= width
        }

        return width
      })
      // relative widths
      .map(function(width) {
        if (utils.isRelative(width)) {
          width = parseFloat(width, 10)
          if (spaceLeft > 0) {
            return (width / 100) * spaceLeft
          } else {
            return 0
          }
        } else {
          return width
        }
      })

      break
    default:
      throw new Error('Table layout `' + this.style.tableLayout + '` not implemented')
  }

  this.children.forEach(function(row, j) {
    row.x = this.x
    row.width = this.width
    row.widths = this.widths

    // unify border
    var index = 0
    row.children.forEach(function(cell, i) {
      if (j > 0) {
        var onTop = this.children[j - 1].refs[index++]
        if (!onTop) {
          return
        }

        if (cell.style.getBorderTopWidth()) {
          var horizontalWidth, horizontalColor

          if (cell.style.getBorderTopWidth() > onTop.style.getBorderBottomWidth()) {
            horizontalWidth = cell.style.getBorderTopWidth() / 2
            horizontalColor = cell.style.getBorderTopColor()
          } else {
            horizontalWidth = onTop.style.getBorderBottomWidth() / 2
            horizontalColor = onTop.style.getBorderBottomColor()
          }

          onTop.style = onTop.style.merge({
            borderBottomWidth: horizontalWidth,
            borderBottomColor: horizontalColor
          })

          cell.style = cell.style.merge({
            borderTopWidth: horizontalWidth,
            borderTopColor: horizontalColor
          })

          if (cell.style.colspan > 1) {
            for (var k = 1; k < cell.style.colspan; ++k) {
              var next = this.children[j - 1].children[index++]
              if (!next) {
                break
              }
              next.style = next.style.merge({
                borderBottomWidth: horizontalWidth,
                borderBottomColor: horizontalColor
              })
            }
          }
        }
      }

      if (i > 0) {
        var onLeft = row.children[i - 1]

        if (cell.style.getBorderLeftWidth() > 0) {
          var verticalWidth, verticalColor

          if (cell.style.getBorderLeftWidth() > onLeft.style.getBorderRightWidth()) {
            verticalWidth = cell.style.getBorderLeftWidth() / 2
            verticalColor = cell.style.getBorderLeftColor()
          } else {
            verticalWidth = onLeft.style.getBorderRightWidth() / 2
            verticalColor = onLeft.style.getBorderRightColor()
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
      }
    }, this)
  }, this)

  if (this.afterBreak.length) {
    this.afterBreak[0].children.forEach(function(row) {
      row.x = this.x
    }, this)
  }

  this.beforeBreakChildren.forEach(function(row, j) {
    row.width = this.width
    row.widths = this.widths
  }, this)
}
