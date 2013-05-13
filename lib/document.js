var PDFObject = require('./datatypes/object')
  , Pages     = require('./pages')
  , Font      = require('./font')

var Document = module.exports = function() {
  this.version = 1.3
  this.width   = 612
  this.height  = 792
  
  this.objects   = []
  this.nextObjId = 1
  
  this.fonts      = {}
  this.nextFontId = 1
  
  this.catalog = this.createObject('Catalog')
  this.pages   = new Pages(this)
  
  this.catalog.addProperty('Pages', this.pages.toReference())
}

Document.prototype.addPage = function() {
  return this.pages.addPage()
}

Document.prototype.font = function(name) {
  if (name in this.fonts) return this.fonts[name]
  return this.fonts[name] = new Font(this, 'F' + this.nextFontId++, name)
}

Document.prototype.createObject = function(type) {
  var object = new PDFObject(this.nextObjId++, 0)
  if (type) object.addProperty('Type', type)
  this.objects.push(object)
  return object
}

Document.prototype.toString = function() {
  var buf = '', xref = [], startxref
  
  // header
  buf += '%PDF-' + this.version.toString() + '\n\n'
  
  // body
  this.objects.forEach(function(object) {
    xref.push(buf.length)
    buf += object.toString() + '\n\n'
  })
  
  // cross-reference table
  startxref = buf.length
  buf += 'xref\n'
  buf += '0 ' + (this.objects.length + 1) + '\n'
  buf += '0000000000 65535 f \n'
  xref.forEach(function(ref) {
    buf += '0000000000'.substr(ref.toString().length) + ref + ' 00000 n \n' 
  })
  
  // trailer
  buf += 'trailer\n'
  buf += '<<\n'
  buf +=   '\t/Size ' + (this.objects.length + 1) + '\n'
  buf +=   '\t/Root ' + this.catalog.toReference().toString() + '\n'
  buf += '>>\n'
  buf += 'startxref\n'
  buf += startxref + '\n'
  buf += '%%EOF'
  return buf
}