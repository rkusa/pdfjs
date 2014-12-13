'use strict'

var PDFObject     = require('./object/object')
var PDFStream     = require('./object/stream')
var PDFDictionary = require('./object/dictionary')
var PDFArray      = require('./object/array')
var PDFName       = require('./object/name')

var utils = require('./utils')

var Page = module.exports = function(parent, offset) {
  PDFObject.call(this, 'Page')

  this.document = parent.document

  this.offset   = offset
  // this.top =
  this.bottom   = (this.document.style.paddingBottom || this.document.style.padding || 0) - offset

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

utils.inherits(Page, PDFObject)

Page.prototype.embed = function(doc) {
  doc.addObject(this)
  doc.addObject(this.contents.object)
}
