'use strict'

const PDFObject     = require('./object')
const PDFStream     = require('./stream')
const PDFDictionary = require('./dictionary')
const PDFArray      = require('./array')
const PDFName       = require('./name')

module.exports = class Page extends PDFObject {
  constructor(parent) {
    super('Page')

    this.contents = new PDFStream(new PDFObject)
    this.fonts    = new PDFDictionary({})
    this.xobjects = new PDFDictionary({})

    this.prop('Parent', parent.toReference())
    this.prop('Contents', this.contents.toReference())
    this.prop('Resources', new PDFDictionary({
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
  }
}
