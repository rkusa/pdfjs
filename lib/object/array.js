"use strict";

const PDFValue = require("./value");

class PDFArray {
  constructor(array) {
    if (!array) {
      array = [];
    }

    array.toString = function () {
      return "[" + this.map((item) => String(item)).join(" ") + "]";
    };

    return array;
  }

  static parse(xref, lexer, trial) {
    if (lexer.getString(1) !== "[") {
      if (trial) {
        return undefined;
      }

      throw new Error("Invalid array");
    }

    lexer.shift(1);
    lexer.skipWhitespace(null, true);

    const values = [];

    if (lexer.pos > lexer.buf.length) {
      throw new Error(`Lexer position exceeded buffer length while parsing array: pos: ${lexer.pos}, buffer length: ${lexer.buf.length}`);
    }

    while (lexer.getString(1) !== "]") {
      values.push(PDFValue.parse(xref, lexer));
      lexer.skipWhitespace(null, true);
    }

    lexer.shift(1);

    return new PDFArray(values);
  }
}

module.exports = PDFArray;
