'use strict'

var RowNode = module.exports = function(row) {
  RowNode.super_.call(this)

  this.type = 'RowNode'
  this.allowBreak = false
  this.direction = 'leftRight'

  this.row      = row
  this.style    = row.style
  this.children = this.row.children.map(function(child) {
    return child.createNode()
  })
  this.isFirst  = false

  this.refs = []
  for (var i = 0; i < this.children.length; ++i) {
    var child = this.children[i]
    this.refs.push(child)

    if (child.style.colspan > 1) {
      for (var j = 1; j < child.style.colspan; ++j) {
        this.refs.push(child)
      }
    }
  }
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

RowNode.prototype.clone = function() {
  var clone = new RowNode(this.row)
  clone.style = this.style
  clone.width = this.width
  clone.widths = this.widths
  clone.children = this.children.map(function(child) {
    return child.clone()
  })
  return clone
}

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

  var offset = 0, index = 0
  this.children.forEach(function(child, i) {
    // set width
    child.width = (this.widths[index++] || 0)
               - child.style.borderLeftWidth - child.style.paddingLeft
               - child.style.paddingRight - child.style.borderRightWidth

    if (child.style.colspan > 1) {
      for (var j = 1; j < child.style.colspan; ++j) {
        child.width += this.widths[index++] || 0
      }
    }

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
  cursor.y = this.y - this.height

  return cursor
}

var BoxNode = require('./box')

RowNode.prototype.begin = function(doc, parent) {
  this.children.forEach(function(child) {
    BoxNode.prototype.begin.call(child, doc, parent)
  })
}
