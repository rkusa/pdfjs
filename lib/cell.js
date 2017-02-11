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

  /// private API

  async _pageBreak(level) {
    const height = this._startY - this._cursor.y

    let contents, offset
    if (height / this._doc.height <= .15) {
      // move already rendered cell content to the next page if the current cell height does only
      // make up about 10% of the total page height
      const idx = this._doc._contents.indexOf(this._bgLayerRef)
      contents = this._doc._contents.splice(idx, this._doc._contents.length - idx)
      offset = height - this.padding
    } else {
      // on page breaks, always draw background until the current bottom
      this._cursor.y = this._cursor.bottom - this.padding

      // create background on each page break
      await this._createBackground()
    }

    if (this._parent) {
      await this._parent._pageBreak(level + 1)
    }

    // By pushing the following at the beginning of the cell's pending queue instead of executing
    // it directly, we ensure that is executed just before the cell's content continues rendering
    // on the next page - especially when cells are appended horizontally into rows.
    this._pending.unshift(async () => {
      this._cursor.reset()

      if (contents) {
        await this._doc._startContentObject()
        await this._doc._write(ops.q() + ops.cm(1, 0, 0, 1, 0, this._cursor.y - this._startY))
        this._doc._contents.push.apply(this._doc._contents, contents)

        await this._doc._startContentObject()
        await this._doc._write(ops.Q())

        this._bgLayerRef = 0
        this._startY = this._cursor.y
      }

      if (offset > 0) {
        this._cursor.y -= offset
      }

      // apply padding after page break (but only to most inner cell)
      if (level === 1) {
        this._cursor.y -= this.padding
        this._cursor.bottom += this.padding
      }
    })
  }

  async _createBackground() {
    // if there is no backgroundColor, it is not necessary to create the background layer
    if (!this.backgroundColor) {
      return
    }

    // start a new content object for the background and border layer
    await this._doc._startContentObject()

    // put the background layer behind the cell
    const layer = this._doc._contents.pop()
    const bgLayerIndex = this._bgLayerRef ? this._doc._contents.indexOf(this._bgLayerRef) : 0
    this._doc._contents.splice(bgLayerIndex, 0, layer)

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

    // console.log('createBackground', this._cursor.startX - this.padding, this._startY - height, this.outerWidth, height) // rectangle

    await this._doc._write(chunk)

    // for succeeding pages put background layers at index 0 (for bgLayerRef === null, index 0
    // will be used)
    this._bgLayerRef = null

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
    this._bgLayerRef = await this._doc._startContentObject()
  }

  async _end() {
    // apply bottom padding (but only for the most inner cell or or last background)
    this._cursor.y -= this.padding

    // create final createBackground
    await this._createBackground()

    // restore cursor
    this._cursor.x = this._cursor.startX - this.padding
  }
}
