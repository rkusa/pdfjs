'use strict'

module.exports = class PDFXref {
  constructor() {
    this.objects = []
  }

  add(id, offset, obj) {
    this.objects[id] = {
      offset: offset,
      obj:    obj,
    }
  }

  get(id) {
    return this.objects[id] && this.objects[id].obj
  }

  getOffset(id) {
    return this.objects[id] && this.objects[id].offset
  }

  toString() {
    let xref = 'xref\n'

    let range  = { from: 0, refs: [0] }
    const ranges = [range]

    for (let i = 1; i < this.objects.length; ++i) {
      const obj = this.objects[i]
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

  static parse(_, lexer) {
    const xref = new PDFXref()

    if (lexer.readString(4) !== 'xref') {
      throw new Error('Invalid xref: xref expected but not found')
    }

    lexer.skipEOL(1)

    let start
    while ((start = lexer.readNumber(true)) !== undefined) {
      lexer.skipSpace(1)
      const count = lexer.readNumber()
      lexer.skipSpace(null, true)
      lexer.skipEOL(1)

      for (let i = 0, len = 0 + count; i < len; ++i) {
        const offset = lexer.readNumber()
        lexer.skipSpace(1)
        lexer.readNumber() // generation
        lexer.skipSpace(1)
        const key = lexer.readString(1)
        lexer.skipSpace(null, true)
        lexer.skipEOL(1)

        const id = start + i
        if (id > 0 && key === 'n') {
          xref.add(id, offset, null)
        }
      }
    }

    return xref
  }

}
