exports.parse = function(xref, lexer, trial) {
  var isTrue = lexer.getString(4) === 'true'
  var isFalse = !isTrue && lexer.getString(5) === 'false'

  if (!isTrue && !isFalse) {
    if (trial) {
      return undefined
    }

    throw new Error('Invalid boolean')
  }

  if (isTrue) {
    lexer.shift(4)
  } else {
    lexer.shift(5)
  }

  return isTrue
}
