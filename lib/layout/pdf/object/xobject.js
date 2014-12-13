var PDFObject = require('./object')
var PDFStream = require('./stream')

var PDFXObject = module.exports = function(id, rev) {
  PDFObject.call(this, id, rev)

  this.content = new PDFStream(this)

  this.prop('Type', 'XObject')
  this.prop('Filter', 'ASCIIHexDecode')
}

PDFXObject.prototype = Object.create(PDFObject.prototype, {
  constructor: { value: PDFXObject }
})
