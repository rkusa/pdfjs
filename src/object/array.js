'use strict'

import * as PDFValue from './value'

export default class PDFArray {
  constructor(array) {
    if (!array) {
      array = []
    }

    array.toString = function() {
      return '[' + this.map(item => String(item)).join(' ') + ']'
    }

    return array
  }

  static async parse(xref, lexer, trial) {
    if (lexer.getString(1) !== '[') {
      if (trial) {
        return undefined
      }

      throw new Error('Invalid array')
    }

    lexer.shift(1)
    lexer.skipWhitespace(null, true)

    const values = []

    while (lexer.getString(1) !== ']') {
      values.push(await PDFValue.parse.call(this, xref, lexer))
      lexer.skipWhitespace(null, true)
    }

    lexer.shift(1)

    return new PDFArray(values)
  }
}
