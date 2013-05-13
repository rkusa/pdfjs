var PDFStream     = require('./datatypes/stream')
  , PDFDictionary = require('./datatypes/dictionary')
  , Text          = require('./text')

var Page = module.exports = function(document, parent) {
  this.document = document
  this.object   = this.document.createObject('Page')
  this.contents = new PDFStream(document.createObject())
  this.fonts    = new PDFDictionary({})
  
  this.object.addProperty('Parent', parent.toReference())
  this.object.addProperty('Contents', this.contents.toReference())
  
  this.object.addProperty('Resources', new PDFDictionary({
    Font: this.fonts
  }))
}

Page.prototype.text = function(text, options) {
  new Text(this, text, options)
}

Page.prototype.addFont = function(font) {
  this.fonts.add(font.id, font.toReference())
}

Page.prototype.toReference = function() {
  return this.object.toReference()
}