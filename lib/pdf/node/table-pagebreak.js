'use strict'

var TablePageBreakNode = module.exports = function(id, offset) {
  TablePageBreakNode.super_.call(this, id, offset)

  this.children = []
}

require('../utils').inherits(TablePageBreakNode, require('./pagebreak'))

Object.defineProperties(TablePageBreakNode.prototype, {
  height: {
    enumerable: true,
    get: function() {
      return this.children.map(function(child) { return child.height })
                          .reduce(function(lhs, rhs) { return lhs + rhs }, 0)
    }
  }
})

TablePageBreakNode.with = function(children) {
  return function(id, offset, parent, idx) {
    var node = new TablePageBreakNode(id, offset)

    node.update = function(idx) {
      node.children = children.map(function(child) {
        return child.create(idx)
      })
    }

    node.update(idx)

    return node
  }
}

TablePageBreakNode.prototype._compute = function(cursor) {
  this.x = cursor.x
  this.y = cursor.y
}

TablePageBreakNode.prototype.beforeContent = function(cursor) {
  this.yBefore = cursor.y
  return cursor
}

TablePageBreakNode.prototype.afterContent = function(cursor) {
  cursor.y = this.yBefore
}
