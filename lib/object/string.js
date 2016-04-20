'use strict'

module.exports = class PDFString {
  constructor(str) {
    this.str = str
  }

  toHexString() {
    // convert to hex string
    let hex = ''
    for (let i = 0, len = this.str.length; i < len; ++i) {
      let h = (this.str.charCodeAt(i) - 31).toString(16)
      // left pad zeroes
      h = ('0000' + h).slice(-4)
      hex += h
    }
    return hex
  }

  toString() {
    return '(' + this.str.replace(/\\/g, '\\\\')
                         .replace(/\(/g, '\\(')
                         .replace(/\)/g, '\\)') + ')'
  }
}
