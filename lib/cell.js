'use strict'

const Fragment = require('./fragment')
const util = require('./util')
const ops = require('./ops')

module.exports = class Cell extends Fragment {
  constructor(doc, parent, opts) {
    super(doc, parent)

    this._pending = []

    // create new cursor for cell context
    // const previousCursor = this._cursor
    this._cursor = this._cursor.clone()
    if ('width' in opts) {
      this._cursor.width = opts.width
    }
    this.padding = 0
    if ('padding' in opts) {
      this.padding = opts.padding
    }
    if (this.padding > 0) {
      this._cursor.startX += this.padding
      this._cursor.width -= 2 * this.padding
      this._cursor.bottom = this._cursor.startY - this._cursor.height + this.padding
    }

    // background creation callback
    this.backgroundColor = util.colorToRgb(opts.backgroundColor)
  }

  async _pageBreak(level) {
    // create background on each page break
    await this._createBackground(level === 1)

    if (this._parent) {
      const ok = await this._parent._pageBreak(level + 1)
      if (!ok) {
        return false
      }
    }

    this._cursor.reset()

    // apply padding after page break (but only to most inner cell)
    if (level === 1) {
      this._cursor.y -= this.padding
      this._cursor.bottom += this.padding
    }

    return true
  }

  async _createBackground(withBottomPadding) {
    // apply bottom padding (but only for the most inner cell or or last background)
    if (withBottomPadding) {
      this._cursor.y -= this.padding
    }

    // if there is no backgroundColor, it is not necessary to create the background layer
    if (!this.backgroundColor) {
      return
    }

    // start a new content object for the background and border layer
    await this._doc._startContentObject()

    // put the background layer behind the cell
    const layer = this._doc._pageContents.content.pop()
    const bgLayerIndex = this.bgLayerRef ? this._doc._pageContents.content.indexOf(this.bgLayerRef) : 0
    this._doc._pageContents.content.splice(bgLayerIndex, 0, layer)

    // calculate background height
    let height = this._startY - this._cursor.y
    const bottom = this._cursor.bottom - this.padding
    if (this._startY - height < bottom) {
      // if background height goes beyond bottom of document, trim it to the bottom
      height = this._startY - bottom
    }

    // write background
    const chunk = ops.q() // save graphics state
      + ops.sc(this.backgroundColor[0], this.backgroundColor[1], this.backgroundColor[2]) // non-stroking color
      + ops.re(this._cursor.startX - this.padding, this._startY - height, this.outerWidth, height) // rectangle
      + ops.f() // fill path
      + ops.Q() // restore graphics state
    console.log('createBackground', this._cursor.startX - this.padding, this._startY - height, this.outerWidth, height) // rectangle

    await this._doc._write(chunk)

    // for succeeding pages put background layers at index 0 (for bgLayerRef === null, index 0
    // will be used)
    this.bgLayerRef = null

    // update startAt to take page break into account
    this._startY = this._cursor.startY
  }

  async _start() {
    if (!this._doc._currentPage) {
      await this._doc._startPage()
    }

    this._startY = this._cursor.y

    this._cursor.x = this._cursor.startX
    this._cursor.y -= this.padding

    this.outerWidth = this._cursor.width + 2 * this.padding

    // start a new content layer for cells
    // save the current layer ref, this will be used to place the background and border layer
    // after the cell has been rendered
    // Note: saving the index directly would  not work for nested rendering tasks
    this.bgLayerRef = await this._doc._startContentObject()
  }

  async _end() {
    // create final createBackground
    await this._createBackground(true)

    // restore cursor
    this._cursor.x = this._cursor.startX - this.padding
  }
}
