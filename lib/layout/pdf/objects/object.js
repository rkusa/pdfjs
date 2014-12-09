// > Objects may be labeled so that they can be referred to by other objects.
//   A labeled object is called an indirect object.
// pdfjs just calls them `references`

var PDFReference  = require('./reference')
var PDFDictionary = require('./dictionary')

var PDFObject = module.exports = function(id, rev) {
  this.id         = id || null
  this.rev        = rev || 0
  this.properties = new PDFDictionary()
  this.reference  = new PDFReference(this)
  this.content    = null
}

PDFObject.prototype.addProperty = PDFObject.prototype.prop = function(key, val) {
  this.properties.add(key, val)
}

PDFObject.prototype.toReference = function() {
  return this.reference
}

PDFObject.prototype.toString = function() {
  return this.id.toString() + ' ' + this.rev + ' obj\n' +
         (this.properties.length ? this.properties.toString() + '\n' : '') +
         (this.content !== null ? this.content.toString() + '\n' : '') +
         'endobj'
}
