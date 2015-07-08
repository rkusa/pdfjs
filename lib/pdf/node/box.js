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
      if (this.style.height > 0 && this.style.overflow === 'hidden') {
        return this.style.height
      }

      var height = this.children
          .map(function(child) { return child.height })
          .reduce(function(lhs, rhs) { return lhs + rhs }, 0)
        + this.style.getBorderTopWidth() + this.style.paddingTop
        + this.style.paddingBottom + this.style.getBorderBottomWidth()

      return Math.max(this.style.height || 0, height)
    }
  },
  beforeBreakHeight: {
    enumerable: true,
    configurable: true,
    get: function() {
      return this.style.paddingBottom + this.style.getBorderBottomWidth()
    }
  }
})

BoxNode.prototype.beforeContent = function(cursor) {
  var top = this.style.getBorderTopWidth() + this.style.paddingTop
  if (top > 0) {
    cursor.y -= top
  }

  this.xBefore = cursor.x
  if (this.style.x !== null && this.style.x !== undefined) {
    cursor.x = this.style.x
  }

  var left = this.style.getBorderLeftWidth() + this.style.paddingLeft
  if (left > 0) {
    cursor.x += left
  }

  var height = this.height > 0 && this.style.overflow === 'hidden'
    ? this.height - (top + this.style.paddingBottom + this.style.getBorderBottomWidth())
    : undefined
  return cursor.create(this.width, height)
}

BoxNode.prototype.afterContent = function(cursor) {
  var bottom = this.style.getBorderBottomWidth() + this.style.paddingBottom
  if (bottom > 0) {
    cursor.y -= bottom
  }

  cursor.x = this.xBefore
  cursor.y = this.y.val - this.height

  return cursor
}

BoxNode.prototype._compute = function(cursor) {
  this.x.val = this.style.x !== null ? this.style.x : cursor.x
  this.y.val = cursor.y = this.style.y !== null ? this.style.y : cursor.y

  var maxWidth = cursor.width
  if (this.x.val + maxWidth > cursor.right) {
    maxWidth = cursor.right - this.x.val
  }

  this.width = utils.resolveWidth(this.style.width, maxWidth)
             - this.style.paddingLeft - this.style.getBorderLeftWidth()
             - this.style.paddingRight - this.style.getBorderRightWidth()
}

BoxNode.prototype.begin = function(doc, parent) {
  var height = this.height
  var width  = this.style.getBorderLeftWidth() + this.style.paddingLeft + this.width + this.style.paddingRight + this.style.getBorderRightWidth()
  var left   = this.x.val + (this.style.getBorderLeftWidth() / 2)
  var top    = this.y.val - (this.style.getBorderTopWidth() / 2)
  var right  = this.x.val + width - (this.style.getBorderRightWidth() / 2)
  var bottom = this.y.val - height + (this.style.getBorderBottomWidth() / 2)

  // backogrund color
  if (this.style.backgroundColor !== null) {
    drawBackground(doc, left - (this.style.getBorderLeftWidth() / 2),
                        bottom - (this.style.getBorderBottomWidth() / 2),
                        width, height,
                        this.style.backgroundColor)
  }

  // border top
  if (this.style.getBorderTopWidth() > 0) {
    drawLine(doc, this.style.getBorderTopWidth(),
                  [left - (this.style.getBorderLeftWidth() / 2), top],
                  [right + (this.style.getBorderRightWidth() / 2), top],
                  this.style.getBorderTopColor())
  }


  // border right
  if (this.style.getBorderRightWidth() > 0) {
    drawLine(doc, this.style.getBorderRightWidth(),
                  [right, top + (this.style.getBorderTopWidth() / 2)],
                  [right, bottom - (this.style.getBorderBottomWidth() / 2)],
                  this.style.getBorderRightColor())
  }

  // border bottom
  if (this.style.getBorderBottomWidth() > 0) {
    drawLine(doc, this.style.getBorderBottomWidth(),
                  [right + (this.style.getBorderRightWidth() / 2), bottom],
                  [left - (this.style.getBorderLeftWidth() / 2), bottom],
                  this.style.getBorderBottomColor())
  }

  // border left
  if (this.style.getBorderLeftWidth() > 0) {
    drawLine(doc, this.style.getBorderLeftWidth(),
                  [left, bottom - (this.style.getBorderBottomWidth() / 2)],
                  [left, top + (this.style.getBorderTopWidth() / 2)],
                  this.style.getBorderLeftColor())
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
