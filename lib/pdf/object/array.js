var PDFArray = module.exports = function(array) {
  if (!array) array = []

  array.toString = function() {
    return '[' +
            this.map(function(item) {
              return String(item)
            }).join(' ') +
           ']'
  }

  return array
}

var PDFValue = require('./value')

PDFArray.parse = function(xref, lexer, trial) {
  if (lexer.getString(1) !== '[') {
    if (trial) {
      return undefined
    }

    throw new Error('Invalid array')
  }

  lexer.shift(1)
  lexer.skipWhitespace(null, true)

  var values = []

  while (lexer.getString(1) !== ']') {
    values.push(PDFValue.parse(xref, lexer))
    lexer.skipWhitespace(null, true)
  }

  lexer.shift(1)

  return new PDFArray(values)
}
