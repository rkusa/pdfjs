var PDFStream     = require('./objects/stream')
var PDFDictionary = require('./objects/dictionary')
var PDFArray      = require('./objects/array')
var PDFName       = require('./objects/name')

var Page = module.exports = function(doc, parent) {
  this.doc        = doc
  this.object     = this.doc.createObject('Page')
  this.contents   = new PDFStream(doc.createObject())
  this.fonts      = new PDFDictionary({})
  this.xobjects   =  new PDFDictionary({})
  this.pageNumber = 1

  this.cursor = {
    y: this.doc.height - this.doc.opts.padding.top,
    x: 0
  }

  this.object.addProperty('Parent', parent.toReference())
  this.object.addProperty('Contents', this.contents.toReference())
  this.object.addProperty('Resources', new PDFDictionary({
    ProcSet: new PDFArray([new PDFName('PDF'), new PDFName('Text'), new PDFName('ImageB'), new PDFName('ImageC'), new PDFName('ImageI')]),
    Font:    this.fonts,
    XObject: this.xobjects
  }))
}

Object.defineProperties(Page.prototype, {
  spaceLeft: {
    enumerable: true,
    get: function() {
      return this.cursor.y - this.doc.padding.bottom
    }
  }
})

Page.prototype.toReference = function() {
  return this.object.toReference()
}
