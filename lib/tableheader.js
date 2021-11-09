'use strict'

// const Fragment = require('./fragment')
// const util = require('./util')
// const ops = require('./ops')
// const Cell = require('./cell')
const PDF = require('./object')
const Row = require('./row')
const Header = require('./header')

module.exports = class TableHeader extends Row {
  constructor(doc, parent, opts) {
    super(doc, parent, opts)

    this._previousContents = null
    this._hadPreviousContent = false

    // a header could consist out of multiple FormXObjects and this property is later used keep
    // track of them
    this._objects = []

    // The cursor.y before the header was rendered
    this._startY = null
  }

  // The y coordinate the header was rendered for. Can be used to calculate the offset when re-
  // using the header.
  get startedAtY() {
    return this._cursor.startY
  }

  /// private API

  // prevent page breaks inside a header
  async _pageBreak() {
    throw new Error('Table Header is to long (tried to execute a page break inside the header)')
  }

  async _start() {
    // Render the header as if it would start at the top of the page and move it to its actual
    // position later on. This prevents page breaks inside of the header when first rendering it
    // close to the bottom of the document.
    this._startY = this._cursor.y
    this._cursor.y = this._cursor.startY

    await super._start()

    this._hadPreviousContent = !!this._doc._currentContent
    await this._doc._endContentObject()

    this._previousContents = this._doc._contents
    this._doc._contents = []

    await Header.prototype._setup.call(this)

    this._cursor.y = this._y
  }

  _createObject() {
    return Header.prototype._createObject.call(this)
  }

  async _end() {
    await super._end()
    const height = this._cursor.startY - this._cursor.y
    await Header.prototype._end.call(this)
    this.height = height

    this._doc._contents = this._previousContents
    this._previousContents = null

    if (this._hadPreviousContent) {
      await this._doc._startContentObject()
    }

    this._cursor.y = this._startY //- this.height
  }
}
