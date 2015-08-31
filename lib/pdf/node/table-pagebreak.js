'use strict'

var TablePageBreakNode = module.exports = function(id, offset, cause) {
  TablePageBreakNode.super_.call(this, id, offset, cause)

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
  this.x.val = cursor.x
  this.y.val = cursor.y
}

TablePageBreakNode.prototype.afterContent = function(cursor) {
  cursor.y = this.y.val
}
