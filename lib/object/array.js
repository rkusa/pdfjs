'use strict'

module.exports = class PDFArray {
  constructor(array) {
    if (!array) {
      array = []
    }

    array.toString = function() {
      return '[' + this.map(item => String(item)).join(' ') + ']'
    }

    return array
  }
}
