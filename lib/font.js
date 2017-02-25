'use strict'

const AFMFont = require('./font/afm')
const OTFFont = require('./font/otf')

module.exports = class Font {
  constructor(arg, set) {
    if (arg instanceof Buffer) {
      return new OTFFont(arg, set)
    } else {
      return new AFMFont(arg, set)
    }
  }
}
