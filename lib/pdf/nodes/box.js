'use strict'

var utils = require('../utils')

var BoxNode = module.exports = function(box) {
  BoxNode.super_.call(this)

  this.type = 'BoxNode'
  this.allowBreak = false

  this.box       = box
  this.style     = box.style
  this.children  = this.box.children.map(function(child) {
    return child.createNode()
  })
}

utils.inherits(BoxNode, require('./base'))

Object.defineProperties(BoxNode.prototype, {
  height: {
    enumerable: true,
    configurable: true,
    get: function() {
      var height = this.children
          .map(function(child) { return child.height })
          .reduce(function(lhs, rhs) { return lhs + rhs }, 0)
        + this.style.borderTopWidth + this.style.paddingTop
        + this.style.paddingBottom + this.style.borderBottomWidth

      return height < this.style.minHeight ? this.style.minHeight : height
    }
  },
  beforeBreakHeight: {
    enumerable: true,
    configurable: true,
    get: function() {
      return this.style.paddingBottom + this.style.borderBottomWidth
    }
  }
})

BoxNode.prototype.beforeContent = function(cursor) {
  var top = this.style.borderTopWidth + this.style.paddingTop
  if (top > 0) {
    cursor.y -= top
  }

  this.xBefore = cursor.x
  if (this.style.x !== null && this.style.x !== undefined) {
    cursor.x = this.style.x
  }

  var left = this.style.borderLeftWidth + this.style.paddingLeft
  if (left > 0) {
    cursor.x += left
  }

  return cursor.create(this.width)
}

BoxNode.prototype.afterContent = function(cursor) {
  var bottom = this.style.borderBottomWidth + this.style.paddingBottom
  if (bottom > 0) {
    cursor.y -= bottom
  }

  cursor.x = this.xBefore
  cursor.y = this.y - this.height

  return cursor
}

BoxNode.prototype._compute = function(cursor) {
  this.x = this.style.x !== null ? this.style.x : cursor.x
  this.y = cursor.y = this.style.y !== null ? this.style.y : cursor.y

  var maxWidth = cursor.width
  if (this.x + maxWidth > cursor.right) {
    maxWidth = cursor.right - this.x
  }

  this.width = utils.resolveWidth(this.style.width, maxWidth)
             - this.style.paddingLeft - this.style.borderLeftWidth
             - this.style.paddingRight - this.style.borderRightWidth
}

BoxNode.prototype.begin = function(doc, parent) {
  var height = this.height
  var width  = this.style.borderLeftWidth + this.style.paddingLeft + this.width + this.style.paddingRight + this.style.borderRightWidth
  var left   = this.x + (this.style.borderLeftWidth / 2)
  var top    = this.y - (this.style.borderTopWidth / 2)
  var right  = this.x + width - (this.style.borderRightWidth / 2)
  var bottom = this.y - height + (this.style.borderBottomWidth / 2)

  // backogrund color
  if (this.style.backgroundColor !== null) {
    drawBackground(doc, left - (this.style.borderLeftWidth / 2),
                        bottom - (this.style.borderBottomWidth / 2),
                        width, height,
                        this.style.backgroundColor)
  }

  // border top
  if (this.style.borderTopWidth > 0) {
    drawLine(doc, this.style.borderTopWidth,
                  [left - (this.style.borderLeftWidth / 2), top],
                  [right + (this.style.borderRightWidth / 2), top],
                  this.style.borderTopColor)
  }


  // border right
  if (this.style.borderRightWidth > 0) {
    drawLine(doc, this.style.borderRightWidth,
                  [right, top + (this.style.borderTopWidth / 2)],
                  [right, bottom - (this.style.borderBottomWidth / 2)],
                  this.style.borderRightColor)
  }

  // border bottom
  if (this.style.borderBottomWidth > 0) {
    drawLine(doc, this.style.borderBottomWidth,
                  [right + (this.style.borderRightWidth / 2), bottom],
                  [left - (this.style.borderLeftWidth / 2), bottom],
                  this.style.borderBottomColor)
  }

  // border left
  if (this.style.borderLeftWidth > 0) {
    drawLine(doc, this.style.borderLeftWidth,
                  [left, bottom - (this.style.borderBottomWidth / 2)],
                  [left, top + (this.style.borderTopWidth / 2)],
                  this.style.borderLeftColor)
  }
}

function drawLine(doc, lineWidth, from, to, color) {
  doc.RG.apply(doc, utils.colorToRgb(color || 0x000000))
  doc.w(lineWidth)
  doc.line(from[0], from[1], to[0], to[1])
}

function drawBackground(doc, x, y, width, height, color) {
  doc.rg.apply(doc, utils.colorToRgb(color || 0x000000))
  doc.rectangle(x, y, width, height)
  doc.f()
}
