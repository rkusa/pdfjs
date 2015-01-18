'use strict'

var Image = require('../object/image')

var ImageNode = module.exports = function(image) {
  ImageNode.super_.call(this)

  this.type = 'ImageNode'

  this.image  = image
  this.style  = image.style
  this.info   = null
}

require('../utils').inherits(ImageNode, require('./base'))


ImageNode.prototype._compute = function(cursor) {
  this.x = cursor.x
  this.y = cursor.y

  if (!this.info) {
    this.info = parseJpegInfo(this.image.src)
    this.width = this.info.width
    this.height = this.info.height

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
    this.height = this.info.height * (width / this.info.width)

    if (height > cursor.pageHeight) {
      this.height = this.pageHeight
      this.width  = this.info.width * (height / this.info.height)
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
  var image = doc.mapping.get(this.image)
  if (!image) {
    image = new Image(doc.images.length + 1, this)
    doc.mapping.set(this.image, image)
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

  doc.q()
  doc.cm(this.width, 0, 0, this.height, x, y)
  doc.Do(image.alias)
  doc.Q()
}


function parseJpegInfo(buffer) {
  var view = new DataView(buffer)
  if (view.getUint8(0) !== 0xff || view.getUint8(1) !== 0xd8) {
    throw new Error('Invalid JPEG image.')
  }

  var blockLength = view.getUint8(4) * 256 + view.getUint8(5)
  var i = 4, len = view.byteLength

  while ( i < len ) {
    i += blockLength

    if (view.getUint8(i) !== 0xff) {
      throw new Error('Could not read JPEG the image size')
    }

    if (
      view.getUint8(i + 1) === 0xc0 || //(SOF) Huffman  - Baseline DCT
      view.getUint8(i + 1) === 0xc1 || //(SOF) Huffman  - Extended sequential DCT
      view.getUint8(i + 1) === 0xc2 || // Progressive DCT (SOF2)
      view.getUint8(i + 1) === 0xc3 || // Spatial (sequential) lossless (SOF3)
      view.getUint8(i + 1) === 0xc4 || // Differential sequential DCT (SOF5)
      view.getUint8(i + 1) === 0xc5 || // Differential progressive DCT (SOF6)
      view.getUint8(i + 1) === 0xc6 || // Differential spatial (SOF7)
      view.getUint8(i + 1) === 0xc7
    ) {
      return {
        height: view.getUint8(i + 5) * 256 + view.getUint8(i + 6),
        width: view.getUint8(i + 7) * 256 + view.getUint8(i + 8),
        colorSpace: view.getUint8(i + 9)
      }
    } else {
      i += 2
      blockLength = view.getUint8(i) * 256 + view.getUint8(i + 1)
    }
  }
}
