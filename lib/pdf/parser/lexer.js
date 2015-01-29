var Lexer = module.exports = function(buf) {
  this.buf = buf
  this.pos = 0
  this.objects = Object.create(null)
}

Lexer.prototype.read = function(len) {
  var buf = this.buf.subarray(this.pos, this.pos + len)
  this.pos += len
  return buf
}

Lexer.prototype.getString = function(len) {
  return String.fromCharCode.apply(null, this.buf.subarray(this.pos, this.pos + len))
}

Lexer.prototype.readString = function(len) {
  var str = this.getString(len)
  this.pos += len
  return str
}

Lexer.prototype.skipEOL = function(len, trial) {
  var before = this.pos

  var done  = false
  var count = 0
  while (!done && (!len || count < len)) {
    switch (this.buf[this.pos]) {
      case 0x0d: // CR
        if (this.buf[this.pos + 1] === 0x0a) { // CR LF
          this.pos++
        }
        // falls through
      case 0x0a: // LF
        this.pos++
        count++
        break
      default:
        done = true
        break
    }
  }

  if (!count || (len && count < len)) {
    if (!trial) {
      this._error('EOL expected but not found')
    }
    this.pos = before
    return false
  }

  return true
}

Lexer.prototype.skipWhitespace = function(len, trial) {
  var before = this.pos

  var done  = false
  var count = 0
  while (!done && (!len || count < len)) {
    if (Lexer.isWhiteSpace(this.buf[this.pos])) {
      this.pos++
      count++
    } else {
      done = true
    }
  }

  if (!count || (len && count < len)) {
    if (!trial) {
      this._error('Whitespace expected but not found')
    }
    this.pos = before
    return false
  }

  return true
}

Lexer.prototype.skipSpace = function(len, trial) {
  var before = this.pos

  var done  = false
  var count = 0
  while (!done && (!len || count < len)) {
    if (this.buf[this.pos] === 0x20) {
      this.pos++
      count++
    } else {
      done = true
    }
  }

  if (!count || (len && count < len)) {
    if (!trial) {
      this._error('Space expected but not found')
    }
    this.pos = before
    return false
  }

  return true
}

Lexer.prototype.shift = function(offset) {
  this.pos += offset
}

Lexer.prototype._nextCharCode = function() {
  return this.buf[this.pos++]
}

Lexer.prototype._nextChar = function() {
  return String.fromCharCode(this.buf[this.pos++])
}

Lexer.prototype._error = function(err) {
  throw new Error(err)
}

Lexer.prototype._warning = function(warning) {
  console.warn(warning)
}

// e.g. 123 43445 +17 −98 0 34.5 −3.62 +123.6 4. −.002 0.0
Lexer.prototype.readNumber = function(trial) {
  var before = this.pos

  var c = this._nextCharCode()
  var sign = 1
  var isFloat = false
  var str = ''

  switch (true) {
    case c === 0x2b: // '+'
      break
    case c === 0x2d: // '-'
      sign = -1
      break
    case c === 0x2e: // '.'
      isFloat = true
      str = '0.'
      break
    case c < 0x30 || c > 0x39: // not a number
      if (!trial) {
        this._error('Invalid number: ' + String.fromCharCode(c))
      }
      this.pos = before
      return undefined
    default:
      str += String.fromCharCode(c)
      break
  }

  var done = false
  while (!done && (c = this._nextCharCode()) >= 0) {
    switch (true) {
      case c === 0x2e: // '.'
        if (isFloat) {
          done = true
        } else {
          isFloat = true
          str += '.'
        }
        break
      case c >= 0x30 && c <= 0x39: // 0 - 9
        str += String.fromCharCode(c)
        break
      default:
        done = true
        break
    }
  }

  this.pos--

  var nr = isFloat ? parseFloat(str, 10) : parseInt(str, 10)
  return nr * sign
}

Lexer.isWhiteSpace = Lexer.prototype.isWhiteSpace = function(c) {
  return (
    c === 0x00 || // NULL
    c === 0x09 || // TAB
    c === 0x0A || // LF
    c === 0x0C || // FF
    c === 0x0D || // CR
    c === 0x20    // SP
  )
}
