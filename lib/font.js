'use strict'

const AFMFont = require('./font/afm')
const OTFFont = require('./font/otf')

module.exports = class Font {
  constructor(arg) {
    if (arg instanceof Buffer) {
      return new OTFFont(arg)
    } else {
      return new AFMFont(arg)
    }
  }
}
