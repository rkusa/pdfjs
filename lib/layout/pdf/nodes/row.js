'use strict'

var RowNode = module.exports = function(row) {
  RowNode.super_.call(this)

  this.type = 'RowNode'
  this.allowBreak = false

  this.row      = row
  this.style    = row.style
  this.children = this.row.children.map(function(child) {
    return child.createNode()
  })
  this.isFirst  = false
}

require('../utils').inherits(RowNode, require('./base'))

Object.defineProperties(RowNode.prototype, {
  height: {
    enumerable: true,
    get: function() {
      return Math.max.apply(Math, this.children.map(function(child) {
        var height = child.minHeight
                   + child.style.paddingTop + child.style.paddingBottom
                   + child.style.borderTopWidth + child.style.borderBottomWidth

        return height
      }, this))
    }
  }
})

RowNode.prototype.mustUpdate = function(cursor) {
  for (var i = 0, len = this.children.length; i < len; ++i) {
    if (this.children[i].mustUpdate(cursor)) {
      return true
    }
  }

  return false
}

RowNode.prototype._compute = function(cursor) {
  this.x = cursor.x
  this.y = cursor.y

  var offset = 0
  this.children.forEach(function(child) {
    child.y = cursor.y
    child.x = cursor.x + offset
    offset += child.width
            + child.style.paddingLeft + child.style.paddingRight
            + child.style.borderRightWidth + child.style.borderLeftWidth
  }, this)
}

RowNode.prototype.afterContent = function(cursor) {
  var height = this.height

  this.children.forEach(function(child) {
    child.height = height
  })

  cursor.x = this.x

  return cursor
}
