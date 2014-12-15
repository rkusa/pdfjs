'use strict'

var utils = require('../utils')

var BoxNode = module.exports = function(box) {
  BoxNode.super_.call(this)

  this.type = 'BoxNode'

  this.box      = box
  this.style    = box.style
  this.children = this.box.children.map(function(child) {
    return child.createNode()
  })
}

utils.inherits(BoxNode, require('./base'))

BoxNode.prototype.beginCompute = function(cursor) {
  var top = this.style.borderTopWidth + this.style.paddingTop
  if (top > 0) {
    cursor.y -= top
  }

  var left = this.style.borderLeftWidth + this.style.paddingLeft
  if (left > 0) {
    cursor.x += left
  }

  this.width = resolveWidth(this.style.width, cursor.width) - this.style.paddingLeft - this.style.borderLeftWidth - this.style.paddingRight - this.style.borderRightWidth
  return cursor.create(this.width)
}

BoxNode.prototype.endCompute = function(cursor) {
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

BoxNode.prototype.render = function(doc, parent) {
  var lines = []

  var height = this.style.borderTopWidth + this.style.paddingTop + this.contentHeight + this.style.paddingBottom + this.style.borderBottomWidth
  var width  = this.style.borderLeftWidth + this.style.paddingLeft + this.width + this.style.paddingRight + this.style.borderRightWidth
  var left   = this.x + (this.style.borderLeftWidth / 2)
  var top    = this.y - (this.style.borderTopWidth / 2)
  var right  = this.x + width - (this.style.borderRightWidth / 2)
  var bottom = this.y - height + (this.style.borderBottomWidth / 2)

  // backogrund color
  if (this.style.backgroundColor !== null) {
    lines.push.apply(lines, drawBackground(left - (this.style.borderLeftWidth / 2), bottom - (this.style.borderBottomWidth / 2), width, height, this.style.backgroundColor))
  }

  // border top
  if (this.style.borderTopWidth > 0) {
    lines.push.apply(lines, drawLine(this.style.borderTopWidth,
                     [left - (this.style.borderLeftWidth / 2), top],
                     [right + (this.style.borderRightWidth / 2), top],
                     this.style.borderTopColor))
  }


  // border right
  if (this.style.borderRightWidth > 0) {
    lines.push.apply(lines, drawLine(this.style.borderRightWidth,
                     [right, top + (this.style.borderTopWidth / 2)],
                     [right, bottom - (this.style.borderBottomWidth / 2)],
                     this.style.borderRightColor))
  }

  // border bottom
  if (this.style.borderBottomWidth > 0) {
    lines.push.apply(lines, drawLine(this.style.borderBottomWidth,
                     [right + (this.style.borderRightWidth / 2), bottom],
                     [left - (this.style.borderLeftWidth / 2), bottom],
                     this.style.borderBottomColor))
  }

  // border left
  if (this.style.borderLeftWidth > 0) {
    lines.push.apply(lines, drawLine(this.style.borderLeftWidth,
                     [left, bottom - (this.style.borderBottomWidth / 2)],
                     [left, top + (this.style.borderTopWidth / 2)],
                     this.style.borderLeftColor))
  }
  console.log('BOX', this.width, this.height, height)

  return lines
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

function drawLine(lineWidth, from, to, color) {
  var lines = [
    utils.colorToRgb(color || 0x000000).join(' ') + ' RG',
    lineWidth + ' w',
    from[0] + ' ' + from[1] + ' m ' + to[0] + ' ' + to[1] + ' l S',
  ]

  return lines
}

function drawBackground(x, y, width, height, color) {
  console.log('DR', arguments)
  return [
    utils.colorToRgb(color || 0x000000).join(' ') + ' rg',
    x + ' ' + y + ' ' + width + ' ' + height + ' re',
    'f',
  ]
}
