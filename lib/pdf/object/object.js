// > Objects may be labeled so that they can be referred to by other objects.
//   A labeled object is called an indirect object.
// pdfjs just calls them `references`

var PDFReference  = require('./reference')
var PDFDictionary = require('./dictionary')
var PDFStream     = require('./stream')

var PDFObject = module.exports = function(id, rev) {
  this.id         = id || null
  this.rev        = rev || 0
  this.properties = new PDFDictionary()
  this.reference  = new PDFReference(this)
  this.content    = null

  // used to have obj.object API for both indirect and direct objects
  this.object = this
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

var PDFValue = require('./value')

PDFObject.parse = function(xref, lexer, trial) {
  var before = lexer.pos

  var id = lexer.readNumber(trial)
  if (id === undefined && !trial) {
    throw new Error('Invalid object')
  }

  lexer.skipSpace(1, trial)
  var generation = lexer.readNumber(trial)
  if (generation === undefined && !trial) {
    throw new Error('Invalid object')
  }

  lexer.skipSpace(1, trial)
  if (lexer.getString(3) !== 'obj') {
    if (trial) {
      lexer.pos = before
      return undefined
    }

    throw new Error('Invalid object')
  }

  lexer.shift(3)

  lexer.skipEOL(1)
  lexer.skipWhitespace(null, true)

  var value = PDFValue.parse(xref, lexer, true)
  if (value === undefined) {
    throw new Error('Empty object')
  }

  lexer.skipWhitespace(null, true)

  var obj = new PDFObject(id, generation)
  if (value instanceof PDFDictionary) {
    obj.properties = value

    if (lexer.getString(6) === 'stream') {
      lexer.shift(6)
      lexer.skipEOL(1)

      var length = obj.properties.get('Length')
      if (length === undefined) {
        throw new Error('Invalid Stream: no length specified')
      }

      if (typeof length === 'object') {
        var pos = lexer.pos
        length = length.object.content
        lexer.pos = pos
      }

      var stream = new PDFStream(obj)
      stream.content = lexer.read(length)
      lexer.skipEOL(1)

      if (lexer.readString(9) !== 'endstream') {
        throw new Error('Invalid stream: `endstream` not found')
      }

      lexer.skipEOL(1)
    }
  } else {
    obj.content = value
  }

  lexer.skipWhitespace(null, true)

  if (lexer.readString(3) !== 'end') {
    throw new Error('Invalid object: `end` not found')
  }

  return obj
}
