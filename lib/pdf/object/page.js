'use strict'

var PDFObject     = require('./object')
var PDFStream     = require('./stream')
var PDFDictionary = require('./dictionary')
var PDFArray      = require('./array')
var PDFName       = require('./name')

var utils = require('../utils')

var Page = module.exports = function(parent) {
  PDFObject.call(this, 'Page')

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
