'use strict'

var utils = require('../utils')
var PDFImage = require('../object/image')
var PDFFormXObject = require('../object/formxobject')

var ImageNode = module.exports = function(image) {
  ImageNode.super_.call(this)

  this.type = 'ImageNode'

  this.image  = image
  this.style  = image.style
  this.type   = this.image.img.type
  this.info   = this.image.img.info
}

require('../utils').inherits(ImageNode, require('./base'))

ImageNode.prototype._compute = function(cursor) {
  this.x.val = cursor.x
  this.y.val = cursor.y

  this.renderWidth = this.info.width
  this.renderHeight = this.info.height

  switch (this.type) {
    case 'jpeg':
      switch (this.info.colorSpace) {
      case 3:
        this.colorSpace = 'DeviceRGB'
        break
      case 1:
        this.colorSpace = 'DeviceGRAY'
        break
      default:
        break
      }
      break
    case 'pdf':
      break
  }

  if (this.style.width && this.style.height) {
    this.renderWidth  = this.style.width
    this.renderHeight = this.style.height
  } else if(this.style.width) {
    this.renderWidth  = this.style.width
    this.renderHeight = this.info.height * (this.style.width / this.info.width)
  } else if (this.style.height) {
    this.renderHeight = this.style.height
    this.renderWidth  = this.info.width * (this.style.height / this.info.height)
  } else {
    this.renderWidth  = Math.min(this.info.width, cursor.width)
    this.renderHeight = this.info.height * (this.renderWidth / this.info.width)

    if (this.renderHeight > cursor.pageHeight) {
      this.renderHeight = cursor.pageHeight
      this.renderWidth  = this.info.width * (this.renderHeight / this.info.height)
    }
  }

  if (this.style.maxWidth) {
    var maxWidth = utils.resolveWidth(this.style.maxWidth, cursor.width)
    if (this.renderWidth > maxWidth) {
      this.renderHeight = this.renderHeight * (maxWidth / this.renderWidth)
      this.renderWidth  = maxWidth
    }
  }

  switch (this.style.align) {
    case 'right':
      this.x.val += cursor.width - this.renderWidth
      break
    case 'center':
      this.x.val += (cursor.width - this.renderWidth) / 2
      break
    case 'left':
    default:
      break
  }

  if (this.style.wrap) {
    this.width  = this.renderWidth
    this.height = this.renderHeight
  } else {
    this.width  = 0
    this.height = 0
  }
}

ImageNode.prototype.beforeContent = function(cursor) {
  if (this.style.wrap) {
    cursor.y -= this.renderHeight
  }

  return cursor
}

ImageNode.prototype.render = function(doc) {
  var image = doc.mapping[this.image.uuid]
  if (!image) {
    switch (this.type) {
      case 'jpeg':
        image = new PDFImage(doc.images.length + 1, this)
        break
      case 'pdf':
        image = new PDFFormXObject(doc.images.length + 1, this)
        break
    }
    doc.mapping[this.image.uuid] = image
    doc.images.push(image)
  }

  if (!doc.currentPage.xobjects.has(image.alias)) {
    doc.currentPage.xobjects.add(image.alias, image.toReference())
  }

  var x = this.x.val
  var y = this.y.val - this.renderHeight


  if (this.style.wrap === false) {
    x = this.style.x !== null ? this.style.x : x
    y = this.style.y !== null ? (this.style.y - doc.offset) : y
  }

  var width, height
  switch (this.type) {
    case 'pdf':
      width  = this.renderWidth / this.info.width
      height = this.renderHeight / this.info.height
      break
    case 'jpeg':
    default:
      width  = this.renderWidth
      height = this.renderHeight
      break
  }

  doc.q()
  doc.cm(width, 0, 0, height, x, y)
  doc.Do(image.alias)
  doc.Q()
}
