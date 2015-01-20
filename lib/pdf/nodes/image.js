'use strict'

var PDFImage = require('../object/image')
var PDFFormXObject = require('../object/formxobject')

var ImageNode = module.exports = function(image) {
  ImageNode.super_.call(this)

  this.type = 'ImageNode'

  this.image  = image
  this.style  = image.style
  this.type   = null
  this.info   = null
}

require('../utils').inherits(ImageNode, require('./base'))

ImageNode.prototype._compute = function(cursor) {
  this.x = cursor.x
  this.y = cursor.y

  if (!this.type) {
    this.type = parseType(this.image.src)

    switch (this.type) {
      case 'jpeg':
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
        break
      case 'pdf':
        this.info = parsePDFInfo(this.image.src)
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

  var width  = this.width / this.info.width
  var height = this.height / this.info.height

  doc.q()
  doc.cm(width, 0, 0, height, x, y)
  doc.Do(image.alias)
  doc.Q()
}

function parseType(buffer) {
  // is PDF?
  var pdf = String.fromCharCode.apply(null, new Uint8Array(buffer, 0, 5))

  if (pdf === '%PDF-') {
    return 'pdf'
  } else {
    return 'jpeg'
  }
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

var Parser = require('../parser/document')

function parsePDFInfo(buffer) {
  var parser = new Parser(buffer)
  parser.parse()

  var catalog  = parser.trailer.get('Root').object.properties
  var pages    = catalog.get('Pages').object.properties
  var first    = pages.get('Kids')[0].object.properties
  var mediaBox = first.get('MediaBox') || pages.get('MediaBox')

  return {
    page:     first,
    width:    mediaBox[2],
    height:   mediaBox[3]
  }
}