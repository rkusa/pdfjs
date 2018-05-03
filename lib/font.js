'use strict'

const AFMFont = require('./font/afm')
const OTFFont = require('./font/otf')

module.exports = class Font {
  constructor(arg) {
    if (arg instanceof Buffer) {
      return new OTFFont(arg)
    } else {
      console.warn("Manual construction of AFM fonts will be removed in the next version (use `require('pdfjs/font/Helvetica')` instead of `new Font(require('pdfjs/font/Helvetica.json'))`")
      return new AFMFont(arg)
    }
  }
}
