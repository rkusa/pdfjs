'use strict'

const Lexer = require('./lexer')
const PDFXref = require('../object/xref')
const PDFTrailer = require('../object/trailer')

module.exports = class Parser {
  // ab ... ArrayBuffer
  constructor(ab) {
    this.src = new Uint8Array(ab)
  }

  parse() {
    let index = lastIndexOf(this.src, 'startxref', 128)
    if (index === -1) {
      throw new Error('Invalid PDF: startxref not found')
    }

    index += 'startxref'.length

    // skip whitespaces
    while (Lexer.isWhiteSpace(this.src[++index])) {
    }

    let str = ''
    while (this.src[index] >= 0x30 && this.src[index] <= 0x39) { // between 0 and 9
      str +=  String.fromCharCode(this.src[index++])
    }

    const startXRef = parseInt(str, 10)

    if (isNaN(startXRef)) {
      throw new Error('Invalid PDF: startxref is not a number')
    }

    const lexer = new Lexer(this.src)
    lexer.shift(startXRef)

    this.xref    = PDFXref.parse(null, lexer)
    this.trailer = PDFTrailer.parse(this.xref, lexer)

    let trailer = this.trailer
    while (trailer.has('Prev')) {
      lexer.pos = trailer.get('Prev')
      const xref = PDFXref.parse(null, lexer)

      for (let i = 0; i < xref.objects.length; ++i) {
        const obj = xref.objects[i]
        if (obj && !this.xref.objects[i]) {
          this.xref.objects[i] = obj
        }
      }

      trailer = PDFTrailer.parse(xref, lexer)
    }
  }
}

function lastIndexOf(src, key, step) {
  if (!step) step = 1024
  let pos = src.length, index = -1

  while (index === -1 && pos > 0) {
    pos -= step - key.length
    index = find(src, key, Math.max(pos, 0), step, true)
  }

  return index
}

function find(src, key, pos, limit, backwards) {
  if (pos + limit > src.length) {
    limit = src.length - pos
  }

  const str = String.fromCharCode.apply(null, src.subarray(pos, pos + limit))
  let index = backwards ? str.lastIndexOf(key) : str.indexOf(key)
  if (index > -1) {
    index += pos
  }
  return index
}
