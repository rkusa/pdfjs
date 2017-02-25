'use strict'

const PDF = require('./object')

module.exports = class ContentChunk {
  constructor(doc) {
    this._doc = doc
    this._fonts = {}
    this._xobjects = {}

    this._object = new PDF.Object()
    this._length = new PDF.Object()

    doc._registerObject(this._object)
    doc._registerObject(this._length)

    this._object.prop('Length', this._length.toReference())
  }

  useFont(font) {
    if (font.alias in this._fonts) {
      return
    }

    this._doc._registerFont(font)
    this._fonts[font.alias] = this._doc._fonts[font.alias].o.toReference()
  }

  useXObject(xobj) {
    if (xobj.alias in this._xobjects) {
      return
    }

    this._doc._registerXObject(xobj)
    this._xobjects[xobj.alias] = this._doc._xobjects[xobj.alias].o.toReference()
  }
}