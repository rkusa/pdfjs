var PDFReference = module.exports = function(object) {
  this._object = object
}

Object.defineProperty(PDFReference.prototype, 'object', {
  enumerable: true,
  get: function() {
    if (!this._object) {
      return undefined
    }

    if (typeof this._object === 'function') {
      this._object = this._object()
    }

    return this._object
  }
})

PDFReference.prototype.toString = function() {
  return this.object.id + ' ' + this.object.rev + ' R'
}

PDFReference.parse = function(xref, lexer, trial) {
  var before = lexer.pos

  var id = lexer.readNumber(trial)
  if (id === undefined && !trial) {
    throw new Error('Invalid indirect')
  }

  lexer.skipSpace(1, trial)
  var generation = lexer.readNumber(trial)
  if (generation === undefined && !trial) {
    throw new Error('Invalid indirect')
  }

  lexer.skipSpace(1, trial)
  if (lexer.getString(1) !== 'R') {
    if (trial) {
      lexer.pos = before
      return undefined
    }

    throw new Error('Invalid indirect')
  }

  lexer.shift(1)

  return new PDFReference(parseObject.bind(null, xref, lexer, id))
}

function parseObject(xref, lexer, id) {
  var obj = xref.get(id)
  if (obj) {
    return obj
  }

  var offset = xref.getOffset(id)
  lexer.pos = offset

  var PDFObject = require('./object')
  return PDFObject.parse(xref, lexer)
}
