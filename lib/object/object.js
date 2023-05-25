'use strict'

const PDFDictionary = require('./dictionary')
const PDFReference  = require('./reference')
const PDFValue = require('./value')

class PDFObject {
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

  static parse(xref, lexer, trial) {
    const before = lexer.pos

    lexer.skipWhitespace(null, true)
    const id = lexer.readNumber(trial)
    if (id === undefined && !trial) {
      throw new Error('Invalid object')
    }
    lexer.skipWhitespace(1, trial)
    const generation = lexer.readNumber(trial)
    if (generation === undefined && !trial) {
      throw new Error('Invalid object')
    }

    lexer.skipWhitespace(1, trial)
    if (lexer.getString(3) !== 'obj') {
      if (trial) {
        lexer.pos = before
        return undefined
      }

      throw new Error('Invalid object')
    }

    lexer.shift(3)

    lexer.skipEOL(1, true)
    lexer.skipWhitespace(null, true)

    const obj = PDFObject.parseInner(xref, lexer)

    lexer.skipWhitespace(null, true)

    if (lexer.readString(3) !== 'end') {
      throw new Error('Invalid object: `end` not found')
    }

    return obj
  }

  static parseInner(xref, lexer) {
    const value = PDFValue.parse(xref, lexer, true)
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

        const PDFStream = require('./stream') // lazy load, cause circular references
        const stream = new PDFStream(obj)
        stream.content = lexer.read(length)

        const orphan = parseEndStream(lexer)
        if (orphan) {
          const merged = new Uint8Array(stream.content.length + orphan.length);
          merged.set(stream.content);
          merged.set(orphan, stream.content.length);
          stream.content = merged
      }

        lexer.skipEOL(1, true)
      }
    } else {
      obj.content = value
    }

    return obj
  }
}

/**
 * Parse an `endstream` while being tolerant to different ways of how different producers understood
 * the spec. If there ends up being any extra content left before the `endstream`, it is returned.
 */
function parseEndStream(lexer) {
  // some producer put the endstream at the end of the last line, and some to the next line
  // -> accept both
  lexer.skipEOL(1, true)

  // not to be expected according to the PDF spec, but there are some PDF files that indent
  // the stream
  lexer.skipWhitespace(null, true)

  const end = lexer.readString(9)
  if (end === 'endstream') {
    return null
  }

  // allow off by one error for length here (#285)
  if (end.endsWith("endstrea")) {
    if (lexer.readString(1) === "m") {
      return Uint8Array.of(end.charCodeAt(0))
    }
  }

  throw new Error('Invalid stream: `endstream` not found')
}

module.exports = PDFObject
