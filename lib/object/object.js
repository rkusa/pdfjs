'use strict'

const PDFReference  = require('./reference')
const PDFDictionary = require('./dictionary')

module.exports = class PDFObject {
  constructor(type) {
    this.id         = null
    this.rev        = 0
    this.properties = new PDFDictionary()
    this.reference  = new PDFReference(this)
    this.content    = null

    if (type) {
      this.prop('Type', type)
    }

    // TODO: still necessary?
    // used to have obj.object API for both indirect and direct objects
    //   this.object = this
  }

  prop(key, val) {
    this.properties.add(key, val)
  }

  toReference() {
    return this.reference
  }

  toString() {
    return this.id.toString() + ' ' + this.rev + ' obj\n' +
           (this.properties.length ? this.properties.toString() + '\n' : '') +
           (this.content !== null ? this.content.toString() + '\n' : '') +
           'endobj'
  }
}
