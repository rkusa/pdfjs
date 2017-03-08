'use strict'

// const Fragment = require('./fragment')
// const util = require('./util')
// const ops = require('./ops')
// const Cell = require('./cell')
const PDF = require('./object')
const Row = require('./row')
const Header = require('./header')

module.exports = class TableHeader extends Row {
  constructor(doc, parent) {
    super(doc, parent)

    this._previousContents = null
    this._hadPreviousContent = false

    // a header could consist out of multiple FormXObjects and this property is later used keep
    // track of them
    this._objects = []
  }

  /// private

  async _start() {
    await Row.prototype._start.call(this)

    await this._doc._endContentObject()

    this._previousContents = this._doc._contents
    this._hadPreviousContent = !!this._doc._currentContent
    this._doc._contents = []

    this._cursor.reset()

    // these objects will be written to the document after all FormXObjects are written
    // it is therefore necessary to keep track of them seperately
    this._resources = new PDF.Object()
    this._doc._registerObject(this._resources)
    this._bbox = new PDF.Object()
    this._doc._registerObject(this._bbox)

    // a FormXObject will receive a Resources dictionary similar to Page objects, which is
    // why it is necessary to keep track of used fonts and xobjects
    this.fonts    = new PDF.Dictionary({})
    this.xobjects = new PDF.Dictionary({})

    // this header object has a similar interface like the page object and it is used as such
    // until the header has finished rendering (necessary to track the used fonts and xobjects)
    this._doc._contentObjCreator = this._createObject.bind(this)

    // close current content object and start a new one (by setting the _contentObjCreator object
    // above, the new content object will be created by calling the header's _createObject
    // method)
    await this._doc._startContentObject()
  }

  _createObject() {
    return Header.prototype._createObject.call(this)
  }

  async _end() {
    await super._end()
    // await Row.prototype._end.call(this)

    // save the height of the header
    // this is used to correctly offset the cursor when rendering the page
    this.height = this._doc._cursor.startY - this._doc._cursor.y

    await this._doc._endContentObject()

    // collect all fonts and xobjects that are used in the header
    for (const content of this._doc._contents) {
      for (const alias in content._fonts) {
        this.fonts.add(alias, content._fonts[alias])
      }

      for (const alias in content._xobjects) {
        this.xobjects.add(alias, content._xobjects[alias])
      }
    }

    // create the Resources object for the header's FormXObjects
    this._resources.content = new PDF.Dictionary({
      ColorSpace: new PDF.Dictionary({
        CS1: new PDF.Array([new PDF.Name('ICCBased'), this._doc._colorSpace.toReference()]),
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
    await this._doc._writeObject(this._resources)

    // setup the BBox
    this._bbox.content = new PDF.Array([
      0, this._cursor.startY,
      this._doc._cursor.width, this._doc._cursor.y
    ])
    await this._doc._writeObject(this._bbox)

    // the header can consist out of multiple FormXObjects, which are collected here
    this._objects.push.apply(this._objects, this._doc._contents.map(c => c._object))

    // reset everything
    this._doc._cursor.reset()

    this._doc._contentObjCreator = null
    this._doc._contents = this._previousContents
    this._previousContents = null

    if (this._hadPreviousContent) {
      console.log('yes')
      await this._doc._startContentObject()
    }
  }
}
