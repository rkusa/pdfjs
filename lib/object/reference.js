'use strict'

class PDFReference {
  constructor(obj) {
    Object.defineProperty(this, 'object', {
      enumerable: true,
      get: () => {
        if (!obj) {
          return undefined
        }

        if (typeof obj === 'function') {
          obj = obj()
        }

        return obj
      }
    })
  }

  toString() {
    return this.object.id + ' ' + this.object.rev + ' R'
  }

  static parse(xref, lexer, trial) {
    const before = lexer.pos

    const id = lexer.readNumber(trial)
    if (id === undefined && !trial) {
      throw new Error('Invalid indirect')
    }

    lexer.skipSpace(1, trial)
    const generation = lexer.readNumber(trial)
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
}

module.exports = PDFReference

function parseObject(xref, lexer, id) {
  const obj = xref.get(id)
  if (obj) {
    return obj
  }

  const offset = xref.getOffset(id)
  lexer.pos = offset

  const PDFObject = require('./object')
  return PDFObject.parse(xref, lexer)
}
