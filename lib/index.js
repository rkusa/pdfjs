'use strict'

exports.Document = require('./document')
exports.Font = require('./font')
exports.FontSet = require('./font/set')

const PDFImage = require('./image/pdf')
const JPEGImage = require('./image/jpeg')

exports.Image = class Image {
  constructor(b, set) {
    const src = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)

    switch (determineType(src)) {
      case 'pdf':
        return new PDFImage(src, set)
      case 'jpeg':
        return new JPEGImage(src, set)
      default:
        throw new TypeError('Unsupported image type')
    }
  }
}

function determineType(buffer) {
  const pdf = String.fromCharCode.apply(null, new Uint8Array(buffer, 0, 5))
  if (pdf === '%PDF-') {
    return 'pdf'
  }

  const view = new DataView(buffer)
  if (view.getUint8(0) === 0xff || view.getUint8(1) === 0xd8) {
    return 'jpeg'
  }

  return null
}

exports.ImageSet = require('./image/set')