'use strict'

exports.Document = require('./document')
exports.Font = require('./font')

const PDFImage = require('./image/pdf')

exports.Image = class Image {
  constructor(b, set) {
    const src = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)

    switch (determineType(src)) {
      case 'pdf':
        return new PDFImage(src, set)
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

  return null
}
