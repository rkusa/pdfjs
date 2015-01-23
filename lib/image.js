'use strict'

var utils = require('./pdf/utils')
var uuid  = require('node-uuid')

module.exports = function(src) {
  this.uuid = uuid.v4()
  this.src  = utils.toArrayBuffer(src)

  this.type = parseType(this.src)

  switch (this.type) {
    case 'jpeg':
      this.info = parseJpegInfo(this.src)
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
      this.info = parsePDFInfo(this.src)
      break
  }
}

function parseType(buffer) {
  var pdf = String.fromCharCode.apply(null, new Uint8Array(buffer, 0, 5))
  if (pdf === '%PDF-') {
    return 'pdf'
  }

  var view = new DataView(buffer)
  if (view.getUint8(0) === 0xff || view.getUint8(1) === 0xd8) {
    return 'jpeg'
  }

  throw new TypeError('Unsupported image type')
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

var Parser = require('./pdf/parser/document')

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
