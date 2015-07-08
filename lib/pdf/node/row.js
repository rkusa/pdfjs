'use strict'

var RowNode = module.exports = function(row) {
  RowNode.super_.call(this)

  this.type = 'RowNode'
  this.direction = 'leftRight'
  this.allowBreak = row.style.allowBreak !== null
        ? row.style.allowBreak
        : this.allowBreak

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
      if (this.style.height > 0 && this.style.overflow === 'hidden') {
        return this.style.height
      }

      return Math.max.apply(Math, this.children.map(function(child) {
        var height = child.minHeight
                   + child.style.paddingTop + child.style.paddingBottom
                   + child.style.getBorderTopWidth() + child.style.getBorderBottomWidth()

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
  clone.x = this.x
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
  if (this.x.val === undefined) {
    this.x.val = cursor.x
  }
  this.y.val = cursor.y

  var offset = 0, index = 0
  this.children.forEach(function(child, i) {
    // set width
    child.width = (this.widths[index++] || 0)
               - child.style.getBorderLeftWidth() - child.style.paddingLeft
               - child.style.paddingRight - child.style.getBorderRightWidth()

    if (child.style.colspan > 1) {
      for (var j = 1; j < child.style.colspan; ++j) {
        child.width += this.widths[index++] || 0
      }
    }

    child.y.val = cursor.y
    child.x.val = cursor.x + offset
    offset += child.width
            + child.style.paddingLeft + child.style.paddingRight
            + child.style.getBorderRightWidth() + child.style.getBorderLeftWidth()
  }, this)
}

RowNode.prototype.afterContent = function(cursor) {
  var height = this.height

  this.children.forEach(function(child) {
    child.height = height
  })

  cursor.x = this.x.val
  cursor.y = this.y.val - this.height
}

var BoxNode = require('./box')

RowNode.prototype.begin = function(doc, parent) {
  this.children.forEach(function(child) {
    BoxNode.prototype.begin.call(child, doc, parent)
  })
}
