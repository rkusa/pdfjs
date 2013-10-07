var PDFStream     = require('./objects/stream')
  , PDFDictionary = require('./objects/dictionary')
  , PDFArray      = require('./objects/array')
  , PDFName       = require('./objects/name')

var Page = module.exports = function(doc, parent) {
  this.doc        = doc
  this.object     = this.doc.createObject('Page')
  this.contents   = new PDFStream(doc.createObject())
  this.fonts      = new PDFDictionary({})
  this.pageNumber = 1
  
  this.cursor = {
    y: this.doc.height - this.doc.opts.padding.top,
    x: 0
  }
                    
  this.object.addProperty('Parent', parent.toReference())
  this.object.addProperty('Contents', this.contents.toReference())
  this.object.addProperty('Resources', new PDFDictionary({
    ProcSet: new PDFArray([new PDFName('PDF'), new PDFName('Text'), new PDFName('ImageB'), new PDFName('ImageC'), new PDFName('ImageI')]),
    Font: this.fonts
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