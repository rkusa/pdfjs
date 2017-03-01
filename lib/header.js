'use strict'

const Fragment = require('./fragment')
const util = require('./util')
const ops = require('./ops')
const PDF = require('./object')

module.exports = class Header extends Fragment {
  constructor(doc, parent) {
    super(doc, parent)

    this.width = this._cursor.width
  }

  /// private API

  async _pageBreak(level) {
    throw new Error('Header is to long (tried to execute a page break inside the header)')
  }

  async _start() {
    await this._doc._endPage()

    this._resources = new PDF.Object()
    this._doc._registerObject(this._resources)
    this._bbox = new PDF.Object()
    this._doc._registerObject(this._bbox)

    this.fonts    = new PDF.Dictionary({})
    this.xobjects = new PDF.Dictionary({})

    this._objects = []

    this._doc._currentPage = this

    // close current content object
    await this._doc._startContentObject()
  }

  _createObject() {
    const xobj = new PDF.Object('XObject')
    xobj.prop('Subtype', 'Form')
    xobj.prop('FormType', 1)
    xobj.prop('BBox', this._bbox.toReference())
    xobj.prop('Resources', this._resources.toReference())
    return xobj
  }

  async write(doc) {
    this._resources.content = new PDF.Dictionary({
      ColorSpace: new PDF.Dictionary({
        CS1: new PDF.Array([new PDF.Name('ICCBased'), doc._colorSpace.toReference()]),
      }),
      ProcSet: new PDF.Array([
        new PDF.Name('PDF'),
        new PDF.Name('Text'),
        new PDF.Name('ImageB'),
        new PDF.Name('ImageC'),
        new PDF.Name('ImageI')
      ]),
      Font:    this.fonts,
      XObject: this.xobjects
    })

    await doc._writeObject(this._resources)

    this._bbox.content = new PDF.Array([0, this._cursor.startY, this.width, this._doc._cursor.y])

    await doc._writeObject(this._bbox)
  }

  async _end() {
    this.height = this._doc._cursor.startY - this._doc._cursor.y

    await this._doc._endContentObject()

    for (const content of this._doc._contents) {
      for (const alias in content._fonts) {
        this.fonts.add(alias, content._fonts[alias])
      }

      for (const alias in content._xobjects) {
        this.xobjects.add(alias, content._xobjects[alias])
      }
    }

    await this.write(this._doc)
    this._doc._cursor.reset()

    this._objects = this._doc._contents.map(c => c._object)

    this._doc._currentContent = null
    this._doc._contents.length = 0

    this._doc._currentPage = null
  }
}
