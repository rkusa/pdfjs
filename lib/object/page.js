'use strict'

const PDFObject     = require('./object')
const PDFStream     = require('./stream')
const PDFDictionary = require('./dictionary')
const PDFArray      = require('./array')
const PDFName       = require('./name')

module.exports = class Page extends PDFObject {
  constructor(parent) {
    super('Page')

    this.fonts    = new PDFDictionary({})
    this.xobjects = new PDFDictionary({})

    this.prop('Parent', parent.toReference())
  }

  async write(doc) {
    this.prop('Resources', new PDFDictionary({
      ColorSpace: new PDFDictionary({
        CS1: new PDFArray([new PDFName('ICCBased'), doc._colorSpace.toReference()]),
      }),
      ProcSet: new PDFArray([
        new PDFName('PDF'),
        new PDFName('Text'),
        new PDFName('ImageB'),
        new PDFName('ImageC'),
        new PDFName('ImageI')
      ]),
      Font:    this.fonts,
      XObject: this.xobjects
    }))

    this.prop('Contents', new PDFArray(doc._contents.map(c => c._object.toReference())))
    await doc._writeObject(this)
  }
}
