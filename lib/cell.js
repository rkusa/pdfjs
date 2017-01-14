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

  }

  _afterBreak() {

  }

  async _end() {

  }

  async _start(text, opts) {

    if (this._doc._mutex) {
      console.log('await')
      // await new Promise(resolve => this._queue.push(resolve))
      console.log('awaited')
    }

    this._doc._mutex = true

    if (!this._doc._currentPage) {
      await this._doc._startPage()
    }

    const startAt = {
      x: this._cursor.x,
      y: this._cursor.y,
      // we only apply bottom padding for the most inner cell and therefore reset
      // the bottom padding of the parent cell here
      bottom: this._cursor.startY - this._cursor.height,
      startY: this._cursor.startY,
    }

    // create new cursor for cell context
    this._cursor.enter()
    const cellDepth = this._cursor.depth

    if ('width' in opts) {
      this._cursor.width = opts.width
    }
    const outerWidth = this._cursor.width
    let padding = 0
    if ('padding' in opts) {
      padding = opts.padding
    }

    if (padding > 0) {
      this._cursor.startX += padding
      this._cursor.x = this._cursor.startX
      this._cursor.y -= padding
      this._cursor.width -= 2 * padding
      this._cursor.bottom = this._cursor.startY - this._cursor.height + padding
    }

    // start a new content layer for cells
    // save the current layer ref, this will be used to place the background and border layer
    // after the cell has been rendered
    // Note: saving the index directly would  not work for nested rendering tasks
    let bgLayerRef = await this._doc._startContentObject()

    // background creation callback
    const backgroundColor = util.colorToRgb(opts.backgroundColor)
    const createBackground = async (isLast) => {
      // apply bottom padding, but only for the most deep (when nesting e.g. cells) element
      if (isLast || this._cursor.depth === cellDepth) {
        this._cursor.y -= padding
      }

      // if there is no backgroundColor, it is not necessary to create the background layer
      if (!backgroundColor) {
        return
      }

      // start a new content object for the background and border layer
      await this._doc._startContentObject()

      // put the background layer behind the cell
      const layer = this._doc._pageContents.content.pop()
      const bgLayerIndex = bgLayerRef ? this._doc._pageContents.content.indexOf(bgLayerRef) : 0
      this._doc._pageContents.content.splice(bgLayerIndex, 0, layer)

      // calculate background height
      let height = startAt.y - this._cursor.y
      if (startAt.y - height < startAt.bottom) {
        // if background height goes beyond bottom of document, trim it to the bottom
        height = startAt.y - startAt.bottom
      }

      // write background
      const chunk = ops.q() // save graphics state
        + ops.sc(backgroundColor[0], backgroundColor[1], backgroundColor[2]) // non-stroking color
        + ops.re(startAt.x, startAt.y - height, outerWidth, height) // rectangle
        + ops.f() // fill path
        + ops.Q() // restore graphics state
      console.log('createBackground', startAt.x, startAt.y - height, outerWidth, height)

      await this._doc._write(chunk)

      // for succeeding pages put background layers at index 0 (for bgLayerRef === null, index 0
      // will be used)
      bgLayerRef = null

      // update startAt to take page break into account
      startAt.y = startAt.startY
    }

    // create background on each page break
    this._cursor.beforeBreak(createBackground)

    // apply padding after page break
    this._cursor.afterBreak(() => {
      if (this._cursor.depth === cellDepth) {
        this._cursor.y -= padding
        this._cursor.bottom += padding
      }
    })

    // render the cell's content
    if (text) {
      await renderText.call(this, text)
    }

    this._end = async () => {
      // create final createBackground
      await createBackground(true)

      this._doc._mutex = false
      if (this._doc._queue.length > 0) {
        this._doc._queue.shift()()
      }

      // restore cursor
      this._cursor.leave()
      // this._cursor.bottom = startAt.bottom
      // previousCursor.y = cursor.y
    }
  }
}
