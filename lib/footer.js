'use strict'

// const Fragment = require('./fragment')
// const util = require('./util')
// const ops = require('./ops')
const PDF = require('./object')
const Header = require('./header')

module.exports = class Footer extends Header {
  constructor(doc, parent) {
    super(doc, parent)
  }

  /// private API

  _createObject() {
    const xobj = Header.prototype._createObject.call(this)
    xobj.prop('Matrix', this._matrix.toReference())
    return xobj
  }

  async _pageBreak(level) {
    throw new Error('Footer is to long (tried to execute a page break inside the header)')
  }

  async _start() {
    this._matrix = new PDF.Object()
    this._doc._registerObject(this._matrix)

    await Header.prototype._start.call(this)
  }
  async write(doc) {
    await Header.prototype.write.call(this, doc)

    const innerHeight = doc._cursor.startY - doc._cursor.bottom
    const offset = innerHeight - this.height
    this._matrix.content = new PDF.Array([1, 0, 0, 1, 0, -offset])
    await doc._writeObject(this._matrix)
  }

  async _end() {
    await Header.prototype._end.call(this)
  }
}
