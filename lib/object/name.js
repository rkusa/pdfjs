'use strict'

class PDFName {
  constructor(name) {
    if (name === undefined || name === null) {
      throw new Error('A Name cannot be undefined')
    }

    if (name instanceof PDFName) {
      return name
    }

    if (name[0] === '/') {
      name = name.substr(1)
    }

    // white-space characters are not allowed
    if (name.match(/[\x00]/)) {
      throw new Error('A Name mustn\'t contain the null characters')
    }

    name = name.toString()

    // Beginning with PDF 1.2, any character except null (character code 0)
    // may be included in a name by writing its 2-digit hexadecimal code,
    // preceded by the number sign character (#)
    // ... it is recommended but not required for characters whose codes
    // are outside the range 33 (!) to 126 (~)
    name = name.replace(/[^\x21-\x7e]/g, function(c) {
      let code = c.charCodeAt(0)
      // replace unicode characters with `_`
      if (code > 0xff) {
        code = 0x5f
      }
      return '#' + Number(code).toString(16)
    })

    // Add # in front of delimiter characters
    //     25  %
    //     28  (
    //     29  )
    //     2f  /
    //     3c  <
    //     3e  >
    //     5b  [
    //     5d  ]
    //     7b  {
    //     7d  }
    name = name.replace(/[\x25\x28\x29\x2f\x3c\x3e\x5b\x5d\x7b\x7d]/g, function(c) {
      let code = c.charCodeAt(0)
      return '#' + Number(code).toString(16)
    })

    this.name = name
  }

  toString() {
    return '/' + this.name
  }

  static parse(xref, lexer, trial) {
    if (lexer.getString(1) !== '/') {
      if (trial) {
        return undefined
      }

      throw new Error('Name must start with a leading slash, found: ' + lexer.getString(1))
    }

    lexer.shift(1)

    let name = ''

    let done = false
    let c
    while (!done && (c = lexer._nextCharCode()) >= 0) {
      switch (true) {
        case c === 0x28: // (
        case c === 0x29: // )
        case c === 0x3c: // <
        case c === 0x3e: // >
        case c === 0x5b: // [
        case c === 0x5d: // ]
        case c === 0x7b: // {
        case c === 0x7d: // }
        case c === 0x2f: // /
        case c === 0x25: // %
          done = true
          break
        case c === 0x23: // #
          const hex = lexer.readString(2)
          name += String.fromCharCode(parseInt(hex, 16))
          break
        case c >= 0x22 && c <= 0x7e: // inside range of 33 (!) to 126 (~)
          name += String.fromCharCode(c)
          break
        default:
          done = true
          break
      }
    }

    lexer.shift(-1)

    return new PDFName(name)
  }
}

module.exports = PDFName
