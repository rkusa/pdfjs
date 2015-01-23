var PDFDictionary = require('./dictionary')
var PDFArray      = require('./array')
var PDFString     = require('./string')
var utils         = require('../utils')

var PDFTrailer = module.exports = function(size, root, info) {
  PDFDictionary.call(this)

  this.set('Size', size)
  this.set('Root', root && root.toReference())

  var id = (new PDFString(info.id)).toHexString()
  this.set('ID', new PDFArray([id, id]))

  this.set('Info', new PDFDictionary({
    Producer: new PDFString(info.producer),
    CreationDate: new PDFString(utils.formatDate(info.creationDate || new Date))
  }))
}

PDFTrailer.prototype = Object.create(PDFDictionary.prototype, {
  constructor: { value: PDFTrailer }
})

PDFTrailer.prototype.toString = function() {
  return 'trailer\n' + PDFDictionary.prototype.toString.call(this)
}

PDFTrailer.parse = function(xref, lexer) {
  lexer.skipWhitespace(null, true)

  if (lexer.readString(7) !== 'trailer') {
    throw new Error('Invalid trailer: trailer expected but not found')
  }

  lexer.skipWhitespace(null, true)

  var dict = PDFDictionary.parse(xref, lexer)
  return dict
}
