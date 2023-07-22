"use strict";

const PDFDictionary = require("./dictionary");
const PDFArray = require("./array");
const PDFString = require("./string");

class PDFTrailer extends PDFDictionary {
  constructor(size, root, id, infoObj) {
    super();

    this.set("Size", size);
    this.set("Root", root && root.toReference());

    const encodedId = new PDFString(id).toHexString();
    this.set("ID", new PDFArray([encodedId, encodedId]));
    this.set("Info", infoObj.toReference());
  }

  toString() {
    return "trailer\n" + PDFDictionary.prototype.toString.call(this);
  }

  static parse(xref, lexer) {
    lexer.skipWhitespace(null, true);

    if (lexer.readString(7) !== "trailer") {
      throw new Error("Invalid trailer: trailer expected but not found");
    }

    lexer.skipWhitespace(null, true);

    const dict = PDFDictionary.parse(xref, lexer);
    return dict;
  }
}

module.exports = PDFTrailer;
