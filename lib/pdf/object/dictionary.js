var PDFName = require('./name')

var PDFDictionary = module.exports = function(dictionary) {
  this.dictionary = {}
  if (dictionary) {
    for (var key in dictionary) {
      this.add(key, dictionary[key])
    }
  }
}

PDFDictionary.prototype.add = PDFDictionary.prototype.set = function(key, val) {
  key = new PDFName(key)
  if (typeof val === 'string') val = new PDFName(val)
  this.dictionary[key] = val
}

PDFDictionary.prototype.has = function(key) {
  return String(new PDFName(key)) in this.dictionary
}

PDFDictionary.prototype.get = function(key) {
  return this.dictionary[new PDFName(key)]
}

PDFDictionary.prototype.toString = function() {
  return '<<\n' +
    Object.keys(this.dictionary).map(function(key) {
      var value = this.dictionary[key] !== null ? this.dictionary[key].toString() : 'null'
      return key.toString() + ' ' + value
    }, this).join('\n').replace(/^/gm, '\t') + '\n' +
  '>>'
}

Object.defineProperty(PDFDictionary.prototype, 'length', {
  get: function() {
    return Object.keys(this.dictionary).length
  },
  enumerable: true
})

var PDFValue = require('./value')

PDFDictionary.parse = function(xref, lexer, trial) {
  if (lexer.getString(2) !== '<<') {
    if (trial) {
      return undefined
    }

    throw new Error('Invalid dictionary')
  }

  lexer.shift(2)
  lexer.skipWhitespace(null, true)

  var dictionary = new PDFDictionary

  while (lexer.getString(2) !== '>>') {
    var key = PDFName.parse(xref, lexer)
    lexer.skipWhitespace(null, true)

    var value = PDFValue.parse(xref, lexer)
    dictionary.set(key, value)

    lexer.skipWhitespace(null, true)
  }

  lexer.shift(2)

  return dictionary
}
