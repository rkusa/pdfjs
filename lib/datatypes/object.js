var PDFReference  = require('./reference')
  , PDFDictionary = require('./dictionary')

var PDFObject = module.exports = function(id, rev) {
  this.id         = id
  this.rev        = rev || 0
  this.properties = new PDFDictionary()
  this.reference  = new PDFReference(this)
  this.content    = null
}

PDFObject.prototype.addProperty = function(key, val) {
  this.properties.add(key, val)
}

PDFObject.prototype.toReference = function() {
  return this.reference
}

PDFObject.prototype.toString = function() {
  var self = this
  
  return this.id.toString() + ' ' + this.rev + ' obj\n' +
         this.properties.toString() + '\n' +
         (this.content !== null ? this.content.toString() + '\n' : '') +
         'endobj'
}