exports.parse = function(xref, lexer, trial) {
  var n = lexer.readNumber(true)

  if (n === undefined) {
    if (trial) {
      return undefined
    }

    throw new Error('Invalid number')
  }

  return n
}
