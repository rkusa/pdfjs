'use strict'

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
  this.x = cursor.x
  this.y = cursor.y

  this.width = this.info.width
  this.height = this.info.height

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
    this.width  = this.style.width
    this.height = this.style.height
  } else if(this.style.width) {
    this.width  = this.style.width
    this.height = this.info.height * (this.style.width / this.info.width)
  } else if (this.style.height) {
    this.height = this.style.height
    this.width  = this.info.width * (this.style.height / this.info.height)
  } else {
    this.width  = Math.min(this.info.width, cursor.width)
    this.height = this.info.height * (this.width / this.info.width)

    if (this.height > cursor.pageHeight) {
      this.height = this.pageHeight
      this.width  = this.info.width * (this.height / this.info.height)
    }
  }

  switch (this.style.align) {
    case 'right':
      this.x += cursor.width - this.width
      break
    case 'center':
      this.x += (cursor.width - this.width) / 2
      break
    case 'left':
    default:
      break
  }
}

ImageNode.prototype.beforeContent = function(cursor) {
  if (this.style.wrap) {
    cursor.y -= this.height
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

  var x = this.x
  var y = this.y - this.height

  if (this.style.wrap === false) {
    x = this.style.x || x
    y = this.style.y || y
  }

  switch (this.type) {
    case 'pdf':
      var width  = this.width / this.info.width
      var height = this.height / this.info.height
      break
    case 'jpeg':
    default:
      var width  = this.width
      var height = this.height
      break
  }

  doc.q()
  doc.cm(width, 0, 0, height, x, y)
  doc.Do(image.alias)
  doc.Q()
}
