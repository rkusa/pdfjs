'use strict'

const Fragment = require('./fragment')
const util = require('./util')
const ops = require('./ops')
const renderText = require('./text')

module.exports = class Cell extends Fragment {
  constructor(doc, cursor) {
    super(doc, cursor)
  }

  async _beforeBreak() {
    await this._createBackground(false)
  }

  _afterBreak() {

  }

  // async _end() {

  // }

  async _createBackground(isLast) {
    // apply bottom padding, but only for the most deep (when nesting e.g. cells) element
    if (isLast || this._cursor._key === this.stashKey) {
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
    let height = this.startAt.y - this._cursor.y
    if (this.startAt.y - height < this.startAt.bottom) {
      // if background height goes beyond bottom of document, trim it to the bottom
      height = this.startAt.y - this.startAt.bottom
    }

    // write background
    const chunk = ops.q() // save graphics state
      + ops.sc(this.backgroundColor[0], this.backgroundColor[1], this.backgroundColor[2]) // non-stroking color
      + ops.re(this.startAt.x, this.startAt.y - height, this.outerWidth, height) // rectangle
      + ops.f() // fill path
      + ops.Q() // restore graphics state
    console.log('createBackground', this.startAt.x, this.startAt.y - height, this.outerWidth, height)

    await this._doc._write(chunk)

    // for succeeding pages put background layers at index 0 (for bgLayerRef === null, index 0
    // will be used)
    this.bgLayerRef = null

    // update startAt to take page break into account
    this.startAt.y = this.startAt.startY
  }

  async _start(text, opts) {
    if (!this._doc._currentPage) {
      await this._doc._startPage()
    }

    this.startAt = {
      x: this._cursor.x,
      y: this._cursor.y,
      // we only apply bottom padding for the most inner cell and therefore reset
      // the bottom padding of the parent cell here
      bottom: this._cursor.startY - this._cursor.height,
      startY: this._cursor.startY,
    }

    // create new cursor for cell context
    this.stashKey = this._cursor.saveStash()

    if ('width' in opts) {
      this._cursor.width = opts.width
    }
    this.outerWidth = this._cursor.width
    this.padding = 0
    if ('padding' in opts) {
      this.padding = opts.padding
    }

    if (this.padding > 0) {
      this._cursor.startX += this.padding
      this._cursor.x = this._cursor.startX
      this._cursor.y -= this.padding
      this._cursor.width -= 2 * this.padding
      this._cursor.bottom = this._cursor.startY - this._cursor.height + this.padding
    }

    // start a new content layer for cells
    // save the current layer ref, this will be used to place the background and border layer
    // after the cell has been rendered
    // Note: saving the index directly would  not work for nested rendering tasks
    this.bgLayerRef = await this._doc._startContentObject()

    // background creation callback
    this.backgroundColor = util.colorToRgb(opts.backgroundColor)

    // create background on each page break
    this._cursor.beforeBreak(() => this._beforeBreak())

    // apply padding after page break
    this._cursor.afterBreak(() => {
      if (this._cursor._key === this.stashKey) {
        this._cursor.y -= this.padding
        this._cursor.bottom += this.padding
      }
    })

    // render the cell's content
    if (text) {
      await renderText.call(this, text)
    }

    this._end = async () => {
      // create final createBackground
      await this._createBackground(true)

      // restore cursor
      this._cursor.restoreStash(this.stashKey)
      this._cursor.deleteStash(this.stashKey)
      // this._cursor.bottom = startAt.bottom
      // previousCursor.y = cursor.y
    }
  }
}
