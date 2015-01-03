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

  this.children.forEach(function(row) {
    row.width = this.width

    row.children.forEach(function(cell, i) {
      cell.width = (this.widths[i] || 0)
             - cell.style.paddingLeft - cell.style.borderLeftWidth
             - cell.style.paddingRight - cell.style.borderRightWidth
    }, this)
  }, this)
}
