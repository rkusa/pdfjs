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
    y: this.doc.height - this.doc.padding.top,
    x: this.doc.padding.left
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

Page.prototype.setStrokeRGBColor = function(r, g, b) {
  this.contents.writeLine(r + ' ' + g + ' ' + b + ' RG')
  return this
}

Page.prototype.setFillRGBColor = function(r, g, b) {
  this.contents.writeLine(r + ' ' + g + ' ' + b + ' rg')
  return this
}

Page.prototype.setTextMatrix = function(a, b, c, d, e, f) {
  this.contents.writeLine(a + ' ' + b + ' ' + c + ' ' + d + ' ' + e + ' ' + f + ' Tm')
  return this
}

Page.prototype.setLineWidth = function(width) {
  this.contents.writeLine(width + ' w')
  return this
}

Page.prototype.stroke = function(from, to) {
  this.contents.writeLine(from[0] + ' ' + from[1] + ' m ' + to[0] + ' ' + to[1] + ' l S')
  return this
}

Page.prototype.toReference = function() {
  return this.object.toReference()
}