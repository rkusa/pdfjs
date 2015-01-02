'use strict'

var utils = require('../utils')

var BoxNode = module.exports = function(box) {
  BoxNode.super_.call(this)

  this.type = 'BoxNode'

  this.box       = box
  this.style     = box.style
  this.children  = this.box.children.map(function(child) {
    return child.createNode()
  })
  this.remaining = null
}

utils.inherits(BoxNode, require('./base'))

Object.defineProperties(BoxNode.prototype, {
  height: {
    enumerable: true,
    get: function() {
      return this.children.map(function(child) { return child.height })
                          .reduce(function(lhs, rhs) { return lhs + rhs }, 0)
    }
  },
  afterBreakHeight: {
    enumerable: true,
    get: function() {
      return this.style.paddingTop
    }
  }
})

BoxNode.prototype.beforeContent = function(cursor) {
  var top = this.style.borderTopWidth + this.style.paddingTop
  if (top > 0) {
    cursor.y -= top
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

  var left = this.style.borderLeftWidth + this.style.paddingLeft
  if (left > 0) {
    cursor.x -= left
  }

  return cursor
}

BoxNode.prototype._compute = function(cursor) {
  this.x = cursor.x
  this.y = cursor.y

  this.width = resolveWidth(this.style.width, cursor.width)
             - this.style.paddingLeft - this.style.borderLeftWidth
             - this.style.paddingRight - this.style.borderRightWidth
}

BoxNode.prototype.begin = function(doc, parent) {
  var height = this.style.borderTopWidth + this.style.paddingTop + this.height + this.style.paddingBottom + this.style.borderBottomWidth
  var width  = this.style.borderLeftWidth + this.style.paddingLeft + this.width + this.style.paddingRight + this.style.borderRightWidth

  var alreadyRendered = height - (this.remaining || height)
  var isFirst = true
  if (this.remaining === null) {
    this.remaining = height
  } else {
    height = this.remaining
    isFirst = false
  }

  var spaceLeft = this.y - doc.doc.style.paddingBottom

  if (height > spaceLeft) {
    height = spaceLeft
    this.remaining -= spaceLeft
  }

  var isLast  = this.remaining === height

  var x = this.x
  var y = this.y - alreadyRendered

  if (!isFirst) {
    y += this.afterBreakHeight
    height += this.afterBreakHeight
  }

  var left   = x + (this.style.borderLeftWidth / 2)
  var top    = y - (this.style.borderTopWidth / 2)
  var right  = x + width - (this.style.borderRightWidth / 2)
  var bottom = y - height + (this.style.borderBottomWidth / 2)

  // backogrund color
  if (this.style.backgroundColor !== null) {
    drawBackground(doc, left - (this.style.borderLeftWidth / 2),
                        bottom - (this.style.borderBottomWidth / 2),
                        width, height,
                        this.style.backgroundColor)
  }

  // border top
  if (isFirst && this.style.borderTopWidth > 0) {
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
  if (isLast && this.style.borderBottomWidth > 0) {
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

function resolveWidth(width, maxWidth) {
  if (!width) {
    return maxWidth
  }

  var isRelative = !!~width.toString().indexOf('%')
  width = parseFloat(width)
  if (isRelative) {
    if (width >= 100) return maxWidth
    return (width / 100) * maxWidth
  } else {
    if (width > maxWidth) return maxWidth
    else return width
  }
}

function drawLine(doc, lineWidth, from, to, color) {
  doc.RG.apply(doc, utils.colorToRgb(color || 0x000000))
  doc.w(lineWidth)
  doc.S(from[0], from[1], 'm', to[0], to[1], 'l')
}

function drawBackground(doc, x, y, width, height, color) {
  doc.rg.apply(doc, utils.colorToRgb(color || 0x000000))
  doc.re(x, y, width, height)
  doc.f()
}
