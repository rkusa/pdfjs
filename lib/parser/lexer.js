"use strict";

class Lexer {
  constructor(buf, outer) {
    this.buf = buf;
    this.pos = 0;
    this.objects = Object.create(null);
    this._outer = outer;
    this.state = outer ? outer.state : {};
  }

  get outer() {
    return this._outer || this;
  }

  read(len) {
    const buf = this.buf.subarray(
      this._assertValidPosition(this.pos),
      this.pos + len,
    );
    this.pos += len;
    return buf;
  }

  getString(len) {
    return String.fromCharCode.apply(
      null,
      this.buf.subarray(this._assertValidPosition(this.pos), this.pos + len),
    );
  }

  readString(len) {
    const str = this.getString(len);
    this.pos += len;
    return str;
  }

  skipEOL(len, trial) {
    const before = this.pos;

    let done = false;
    let count = 0;
    while (!done && (!len || count < len)) {
      switch (this.buf[this.pos]) {
        case 0x0d: // CR
          if (this.buf[this.pos + 1] === 0x0a) {
            // CR LF
            this.pos++;
          }
        // falls through
        case 0x0a: // LF
          this.pos++;
          count++;
          break;
        default:
          done = true;
          break;
      }
    }

    if (!count || (len && count < len)) {
      if (!trial) {
        this._error("EOL expected but not found");
      }
      this.pos = before;
      return false;
    }

    return true;
  }

  skipComments(trial) {
    if (this.getString(1) !== "%") {
      return false;
    }

    let pos = this.pos;
    while (this.buf[pos] !== 0x0a) {
      pos++;
    }

    if (!trial) {
      this.pos = pos;
    }

    return true;
  }

  skipWhitespace(len, trial) {
    const before = this.pos;

    let done = false;
    let count = 0;
    while (!done && (!len || count < len)) {
      // skip comments
      if (this.buf[this.pos] === 0x25 /* % */) {
        while (this.buf[this.pos] !== 0x0a) {
          this.pos++;
        }
      }

      if (Lexer.isWhiteSpace(this.buf[this.pos])) {
        this.pos++;
        count++;
      } else {
        done = true;
      }
    }

    if (!count || (len && count < len)) {
      if (!trial) {
        this._error("Whitespace expected but not found");
      }
      this.pos = before;
      return false;
    }

    return true;
  }

  skipSpace(len, trial) {
    const before = this.pos;

    let done = false;
    let count = 0;
    while (!done && (!len || count < len)) {
      if (this.buf[this.pos] === 0x20) {
        this.pos++;
        count++;
      } else {
        done = true;
      }
    }

    if ((len > 0 && !count) || (len && count < len)) {
      if (!trial) {
        this._error("Space expected but not found");
      }
      this.pos = before;
      return false;
    }

    return true;
  }

  shift(offset) {
    this.pos += offset;
  }

  _nextCharCode() {
    return this.buf[this._assertValidPosition(this.pos++)];
  }

  _nextChar() {
    return String.fromCharCode(this.buf[this._assertValidPosition(this.pos++)]);
  }

  _error(err) {
    throw new Error(err);
  }

  _warning(warning) {
    console.warn(warning);
  }

  // e.g. 123 43445 +17 −98 0 34.5 −3.62 +123.6 4. −.002 0.0
  readNumber(trial) {
    const before = this.pos;

    let c = this._nextCharCode();
    let sign = 1;
    let isFloat = false;
    let str = "";

    switch (true) {
      case c === 0x2b: // '+'
        break;
      case c === 0x2d: // '-'
        sign = -1;
        break;
      case c === 0x2e: // '.'
        isFloat = true;
        str = "0.";
        break;
      case c < 0x30 || c > 0x39: // not a number
        if (!trial) {
          this._error(
            "Invalid number at " +
              this.pos +
              ": " +
              String.fromCharCode(c) +
              " (code: " +
              c +
              ")",
          );
        }
        this.pos = before;
        return undefined;
      default:
        str += String.fromCharCode(c);
        break;
    }

    let done = false;
    while (!done && (c = this._nextCharCode()) >= 0) {
      switch (true) {
        case c === 0x2e: // '.'
          if (isFloat) {
            done = true;
          } else {
            isFloat = true;
            str += ".";
          }
          break;
        case c >= 0x30 && c <= 0x39: // 0 - 9
          str += String.fromCharCode(c);
          break;
        default:
          done = true;
          break;
      }
    }

    this.pos--;

    const nr = isFloat ? parseFloat(str, 10) : parseInt(str, 10);
    return nr * sign;
  }

  static isWhiteSpace(c) {
    return (
      c === 0x00 || // NULL
      c === 0x09 || // TAB
      c === 0x0a || // LF
      c === 0x0c || // FF
      c === 0x0d || // CR
      c === 0x20 // SP
    );
  }

  isEOF() {
    return this.pos >= this.buf.length;
  }

  _assertValidPosition(pos) {
    if (pos >= this.buf.length || pos < 0) {
      throw new Error(
        `lexer position out of bounds (buffer length is ${this.buf.length}; lexer position is ${pos})`,
      );
    }
    return pos;
  }
}

module.exports = Lexer;
