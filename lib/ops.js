'use strict'

const PDFString = require('./object/string')

// low level PDF operations
module.exports = class Ops {
  constructor(doc) {
    this.doc = doc
  }

  BT() {
    this.write('BT')
  }

  ET() {
    this.write('ET')
  }

  Tf(font, size) {
    this.write(font, size, 'Tf')
  }

  rg(r, g, b) {
    this.write(r, g, b, 'rg')
  }

  Tm(a, b, c, d, e, f) {
    this.write(a, b, c, d, e, f, 'Tm')
  }

  Tj(str) {
    const hex = (new PDFString(str)).toHexString()
    this.write(hex, 'Tj')
  }

  Td(x, y) {
    this.write(x, y, 'Td')
  }

  write() {
    const line = Array.prototype.map.call(arguments, arg => {
      return typeof arg === 'number' ? toFixed(arg, this.doc.precision) : arg
    })
    this.doc.write(line.join(' ') + '\n')
  }
}

function toFixed(num, precision) {
  return (+(Math.floor(+(num + 'e' + precision)) + 'e' + -precision)).toFixed(precision)
}
