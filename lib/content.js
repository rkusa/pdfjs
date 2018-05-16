'use strict'

import {PDFObject} from './object'

export default class ContentChunk {
  constructor(doc, obj) {
    this._doc = doc
    this._fonts = {}
    this._xobjects = {}

    this._object = obj || new PDFObject()
    this._length = new PDFObject()

    doc._registerObject(this._object)
    doc._registerObject(this._length)

    this._object.prop('Length', this._length.toReference())
  }
}