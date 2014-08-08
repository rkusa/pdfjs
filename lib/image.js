'use strict'

var PDFXObject = require('./objects/xobject')
var PDFArray   = require('./objects/array')
var utils      = require('./utils')

var Image = module.exports = function(id, buffer) {
  // GLOBAL[('Buffer').toString()] is used instead of Buffer to trick browserify
  // to not load a Buffer polyfill just for instance testing. The `toString()` part
  // is used to trick eslint to not throw
  var isArrayBuffer = buffer instanceof ArrayBuffer
  var isBuffer = typeof GLOBAL !== 'undefined' && buffer instanceof GLOBAL[('Buffer').toString()]
  if (!isArrayBuffer && !isBuffer) {
    throw new Error('Property `' + buffer + '` must be a Buffer or a Arraybuffer.')
  }

  this.buffer = buffer instanceof ArrayBuffer ? buffer : utils.toArrayBuffer(buffer)

  this.id      = id
  this.xobject = new PDFXObject
  this.xobject.prop('Subtype', 'Image')

  var info = getJpegInfo(this.buffer)
  this.xobject.prop('Width',  this.width = info.width)
  this.xobject.prop('Height', this.height = info.height)

  switch (info.colorSpace) {
  case 3:
    this.colorSpace = 'DeviceRGB'
    break
  case 1:
    this.colorSpace = 'DeviceGRAY'
    break
  default:
    break
  }

  this.xobject.prop('ColorSpace', this.colorSpace)
  this.xobject.prop('BitsPerComponent', 8)
}

Image.prototype.embed = function(doc) {
  doc.addObject(this.xobject)

  var hex = utils.asHex(this.buffer)
  this.xobject.prop('Filter', new PDFArray(['/ASCIIHexDecode', '/DCTDecode']))
  this.xobject.prop('Length', hex.length + 1)
  this.xobject.prop('Length1', this.buffer.byteLength)
  this.xobject.content.content = hex + '>\n'
}

Image.prototype.addTo = function(page) {
  page.xobjects.add(this.id, this.xobject.toReference())
}

function getJpegInfo(buffer) {
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
