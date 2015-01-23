var Objects = []

exports.parse = function(xref, lexer) {
  // lazy load, cause circular referecnes
  if (!Objects.length) {
    Objects.push.apply(Objects, [
      require('./boolean'),
      require('./null'),
      require('./name'),
      require('./dictionary'), // must be tried before string!
      require('./string'),
      require('./array'),
      require('./reference'), // must be tried before number!
      require('./number')
    ])
  }

  // try
  for (var i = 0; i < Objects.length; ++i) {
    var value = Objects[i].parse(xref, lexer, true)
    if (value !== undefined) {
      return value
    }
  }

  lexer._error('Invalid value')
  return undefined
}
