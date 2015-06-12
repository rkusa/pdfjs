'use strict'

var utils = require('../utils')
var BoxNode = require('./box')

var CellNode = module.exports = function(cell) {
  CellNode.super_.call(this, cell)

  this.type = 'CellNode'
  this.allowBreak = cell.style.allowBreak !== null
        ? cell.style.allowBreak
        : this.allowBreak

  this.cell = cell
}

utils.inherits(CellNode, BoxNode)

Object.defineProperties(CellNode.prototype, {
  minHeight: {
    enumerable: true,
    get: function() {
      return Math.max(
        this.style.height || 0,
        this.children.map(function(child) { return child.height })
                     .reduce(function(lhs, rhs) { return lhs + rhs }, 0)
      )
    }
  },
  height: {
    enumerable: true,
    value: 0,
    writable: true
  }
})

CellNode.prototype.clone = function() {
  var clone = new CellNode(this.cell)
  clone.style = this.style
  return clone
}

CellNode.prototype.mustUpdate = function(cursor) {
  for (var i = 0, len = this.children.length; i < len; ++i) {
    if (this.children[i].mustUpdate(cursor)) {
      return true
    }
  }

  return false
}

CellNode.prototype.beforeContent = function(cursor) {
  cursor.x = this.x.val
  cursor.y = this.y.val

  return BoxNode.prototype.beforeContent.call(this, cursor)
}

CellNode.prototype._compute = function(cursor) {
}
