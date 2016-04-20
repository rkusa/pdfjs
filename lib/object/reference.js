'use strict'

module.exports = class PDFReference {
  constructor(obj) {
    Object.defineProperty(this, 'object', {
      enumerable: true,
      get: () => {
        if (!obj) {
          return undefined
        }

        if (typeof obj === 'function') {
          obj = obj()
        }

        return obj
      }
    })
  }

  toString() {
    return this.object.id + ' ' + this.object.rev + ' R'
  }
}
