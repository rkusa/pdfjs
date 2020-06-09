'use strict'

const Lexer = require('../parser/lexer')

class PDFString {
  constructor(str) {
    this.str = str
  }

  toHexString() {
    // convert to hex string
    let hex = ''
    for (let i = 0, len = this.str.length; i < len; ++i) {
      let h = (this.str.charCodeAt(i) - 31).toString(16)
      // left pad zeroes
      h = ('0000' + h).slice(-4)
      hex += h
    }
    return '<' + hex + '>'
  }

  toString() {
    return '(' + this.str.replace(/\\/g, '\\\\')
                         .replace(/\(/g, '\\(')
                         .replace(/\)/g, '\\)') + ')'
  }

  static parse(xref, lexer, trial) {
    const literal = PDFString.parseLiteral(lexer, trial)
    const hex = literal === undefined && PDFString.parseHex(lexer, trial)

    if (!literal && !hex) {
      if (trial) {
        return undefined
      }

      throw new Error('Invalid string')
    }

    return literal || hex
  }

  static parseLiteral(lexer, trial) {
    if (lexer.getString(1) !== '(') {
      if (trial) {
        return undefined
      }

      throw new Error('Invalid literal string')
    }

    lexer.shift(1)

    let str = ''

    let done = false
    let open = 0
    let c
    while (!done && (c = lexer._nextCharCode()) >= 0) {
      switch (c) {
        case 0x28: // (
          open++
          str += String.fromCharCode('(')
          break
        case 0x29: // )
          if (open === 0) {
            done = true
          } else {
            open--
            str += String.fromCharCode(')')
          }
          break
        case 0x5c: // \
          c = lexer._nextCharCode()
          switch (c) {
            case 0x6e: // \n
              str += '\n'
              break
            case 0x72: // \r
              str += '\r'
              break
            case 0x74: // \t
              str += '\t'
              break
            case 0x62: // \b
              str += '\b'
              break
            case 0x66: // \f
              str += '\f'
              break
            case 0x28: // '('
            case 0x29: // ')'
            case 0x5c: // '\'
              str += String.fromCharCode(c)
              break
            case 0x30: // 0
            case 0x31: // 1
            case 0x32: // 2
            case 0x33: // 3
            case 0x34: // 4
            case 0x35: // 5
            case 0x36: // 6
            case 0x37: // 7
            case 0x38: // 8
            case 0x39: // 9
              const oct = String.fromCharCode(c) + lexer.readString(2)
              str += String.fromCharCode(parseInt(oct, 8))
              break
            default:
              lexer.shift(-1)
              break
          }
          break
        case 0x0d: // CR
        case 0x0a: // LF
          // ignore EOL characters
          break
        default:
          str += String.fromCharCode(c)
          break
      }
    }

    return new PDFString(str)
  }

  static parseHex(lexer, trial) {
    if (lexer.getString(1) !== '<') {
      if (trial) {
        return undefined
      }

      throw new Error('Invalid hex string')
    }

    lexer.shift(1)

    let str = ''

    let done = false
    const digits = []
    const addCharacter = function(force) {
      if (digits.length !== 2) {
        if (digits.length === 1 && force) {
          digits.push('0')
        } else {
          return
        }
      }

      str += String.fromCharCode(parseInt(digits.join(''), 16))
      digits.length = 0
    }

    let c
    while (!done && (c = lexer._nextCharCode()) >= 0) {
      switch (true) {
        case c === 0x3e: // >
          done = true
          break
        case c >= 0x30 && c <= 0x39: // 0 - 9
        case c >= 0x41 && c <= 0x5a: // A - B
        case c >= 0x61 && c <= 0x7a: // a - b
          digits.push(String.fromCharCode(c))
          addCharacter()
          break
        case Lexer.isWhiteSpace(c):
          break
        default:
          lexer._warning('invalid character `' + String.fromCharCode(c) + '` in hex string')
          break
      }
    }

    addCharacter(true)

    return new PDFString(str)
  }
}

module.exports = PDFString
