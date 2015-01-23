var PDFXref = module.exports = function() {
  this.objects = []
}

PDFXref.prototype.add = function(id, offset, obj) {
  this.objects[id] = {
    offset: offset,
    obj:    obj
  }
}

PDFXref.prototype.get = function(id) {
  return this.objects[id] && this.objects[id].obj
}

PDFXref.prototype.getOffset = function(id) {
  return this.objects[id] && this.objects[id].offset
}

PDFXref.prototype.toString = function() {
  var xref = 'xref\n'

  var range  = { from: 0, refs: [0] }
  var ranges = [range]

  for (var i = 1; i < this.objects.length; ++i) {
    var obj = this.objects[i]
    if (!obj) {
      if (range) {
        range = null
      }
      continue
    }

    if (!range) {
      range = { from: i, refs: [] }
      ranges.push(range)
    }

    range.refs.push(obj.offset)
  }

  ranges.forEach(function(range) {
    xref += range.from + ' ' + range.refs.length + '\n'

    range.refs.forEach(function(ref, i) {
      if (range.from === 0 && i === 0) {
        xref += '0000000000 65535 f \n'
      } else {
        xref += '0000000000'.substr(ref.toString().length) + ref + ' 00000 n \n'
      }
    })
  })

  return xref
}

PDFXref.parse = function(_, lexer) {
  var xref = new PDFXref

  if (lexer.readString(4) !== 'xref') {
    throw new Error('Invalid xref: xref expected but not found')
  }

  lexer.skipEOL(1)

  var start
  while ((start = lexer.readNumber(true)) !== undefined) {
    lexer.skipSpace(1)
    var count = lexer.readNumber()
    lexer.skipEOL(1)

    for (var i = 0, len = 0 + count; i < len; ++i) {
      var offset = lexer.readNumber()
      lexer.skipSpace(1)
      lexer.readNumber() // generation
      lexer.skipSpace(1)
      var key = lexer.readString(1)
      lexer.skipSpace(null, true)
      lexer.skipEOL(1)

      var id = start + i
      if (id > 0 && key === 'n') {
        xref.add(id, offset, null)
      }
    }
  }

  return xref
}
