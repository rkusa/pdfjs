'use strict'

import PDFDictionary from './dictionary'
import PDFReference  from './reference'
import * as PDFValue from './value'

export default class PDFObject {
  constructor(type) {
    this.id         = null
    this.rev        = 0
    this.properties = new PDFDictionary()
    this.reference  = new PDFReference(this)
    this.content    = null

    if (type) {
      this.prop('Type', type)
    }

    // TODO: still necessary?
    // used to have obj.object API for both indirect and direct objects
    //   this.object = this
  }

  prop(key, val) {
    this.properties.add(key, val)
  }

  toReference() {
    return this.reference
  }

  toString() {
    return this.id.toString() + ' ' + this.rev + ' obj\n' +
           (this.properties.length ? this.properties.toString() + '\n' : '') +
           (this.content !== null ? this.content.toString() + '\n' : '') +
           'endobj'
  }

  static async parse(xref, lexer, trial) {
    const before = lexer.pos

    const id = lexer.readNumber(trial)
    if (id === undefined && !trial) {
      throw new Error('Invalid object')
    }
    lexer.skipSpace(1, trial)
    const generation = lexer.readNumber(trial)
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

    const obj = await PDFObject.parseInner.call(this, xref, lexer)

    lexer.skipWhitespace(null, true)

    if (lexer.readString(3) !== 'end') {
      throw new Error('Invalid object: `end` not found')
    }

    return obj
  }

  static async parseInner(xref, lexer) {
    const value = await PDFValue.parse.call(this, xref, lexer, true)
    if (value === undefined) {
      throw new Error('Empty object')
    }

    lexer.skipWhitespace(null, true)

    const obj = new PDFObject()
    if (value instanceof PDFDictionary) {
      obj.properties = value

      if (lexer.getString(6) === 'stream') {
        lexer.shift(6)
        lexer.skipEOL(1)

        let length = obj.properties.get('Length')
        if (length === undefined) {
          throw new Error('Invalid Stream: no length specified')
        }

        if (typeof length === 'object') {
          const pos = lexer.pos
          length = length.object.content
          lexer.pos = pos
        }

        const PDFStream = (await import('./stream')).default // lazy load, cause circular referecnes
        const stream = new PDFStream(obj)
        stream.content = lexer.read(length)
        lexer.skipEOL(1, true)

        if (lexer.readString(9) !== 'endstream') {
          throw new Error('Invalid stream: `endstream` not found')
        }

        lexer.skipEOL(1)
      }
    } else {
      obj.content = value
    }

    return obj
  }
}
