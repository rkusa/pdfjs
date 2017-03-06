'use strict'

const Fragment = require('./fragment')
const util = require('./util')
const ops = require('./ops')
const Cell = require('./cell')

module.exports = class Row {
  constructor(doc, parent) {
    Fragment.prototype._init.call(this, doc, parent)

    // use an own queue for pending operations
    this._pending = []

    // keep track of the cells that have already been ended;
    // this is necessary to be able to still draw their background and finalize their rendering
    // once all cells are ended (scenario where not all cells span the same amount of pages)
    this._endedCells = []

    // keep a count of not ended cells to adjust the rotation of cells on page breaks properly
    this._columns = 0

    // when a page break occures inside a cell, the cells are rotated before an actual page
    // break is rendered; i.e., all cells of the row are rendered horizontally
    this._rotated = 0

    // this is used to keep track of the starting y of the row to reset the cursor's y to
    // this value for each cell (since they are horizontally aligned)
    this._y = 0

    // on each page the row is rendered on, the row keeps track of the maximal y (or minimum
    // in terms of PDF, because y 0 is on the bottom) a cell is rendered to to be able to align
    // the backgrounds of all cells
    this._endY = null

    this._widths = []
    this._borderWidths = []
  }

  /// private API

  async _pageBreak(level) {
    // the pending queue looks as follows: [ [cell1], [cell2], ..., [celln], endRow]
    // the currently rendered cell is at the head of the queue and therefore removed and
    // re-inserted at the second last position
    this._pending.splice(this._pending.length - 2, 0 , this._pending.shift())

    // test whether we have rotated all cells of the row
    if (this._rotated < this._columns - 1) {
      this._rotated++

      // move to the next cell
      this._nextColumn()
    } else {
      // execute the pageBreak (rendering background) of all already ended cells manually
      for (const cell of this._endedCells) {
        await cell._pageBreak(level - 1)
      }

      await this._drawBorders(true)

      // reset the rotation
      this._rotated = 0

      // execute an actual page break
      await this._parent._pageBreak(level + 1)

      // store starting y to be able to align all cells horizontally
      this._y = this._cursor.y

      this._endY = null
    }
  }

  _nextColumn() {
    // reset the current y back to the row start to align all cells horizontally
    this._cursor.y = this._y
  }

  async _start() {
    // save start y of the row to be able to align all cells horizontally
    this._y = this._cursor.y
  }

  async _end() {
    // the actual end logic of cells has been postponed until here where it is called manually
    for (const cell of this._endedCells) {
      this._cursor.y = this._endY + cell.paddingBottom
      await Cell.prototype._end.call(cell)
    }

    await this._drawBorders(false)

    // reset cursor
    this._cursor.x = this._cursor.startX
    this._cursor.y = this._endY
  }

  _begin(ctx) {
    Fragment.prototype._begin.call(this, ctx)
  }

  async _drawBorders(isPageBreak) {
    // detect a retrospective page break and not render boreders in this case
    if (isPageBreak && this._cursor.y > this._cursor.bottom) {
      return
    }

    // draw border
    if (this._borderWidths) {
      let chunk = ops.q() // save graphics state
                + ops.SC(0, 0, 0) // stroking color

      const y1 = this._y
      const y2 = this._endY || this._cursor.bottom
      let x = this._cursor.startX
      let borderWidth = 0

      for (let i = 0; i < this._borderWidths.length; ++i) {
        const bw = this._borderWidths[i]
        if (borderWidth !== bw) {
          chunk += ops.w(bw) // line width
          borderWidth = bw
        }

        chunk += ops.S(x, y1, 'm', x, y2, 'l') // fill path

        x += this._widths[i]
      }

      chunk += ops.Q() // restore graphics state
      await this._doc._write(chunk)
    }
  }

  /// public API

  end() {
    return Fragment.prototype.end.call(this)
  }

  cell(text, opts) {
    // normalize arguments
    if (text !== null && typeof text === 'object') {
      opts = text
      text = undefined
    }
    if (!opts || typeof opts !== 'object') {
      opts = {}
    }

    // create cell and set cell's width according to row options
    const column = this._columns++
    if (!(column in this._widths)) {
      throw new Error('row columns already exceeded, cannot create another cell')
    }

    // adjust cell padding to add enough space for borders
    if (this._borderWidths) {
      const borderWidthLeft = this._borderWidths[column]
      const borderWidthRight = this._borderWidths[column + 1]

      opts.paddingLeft = (opts.paddingLeft || opts.padding || 0) + borderWidthLeft / 2
      opts.paddingRight = (opts.paddingRight || opts.padding || 0) + borderWidthRight / 2
    }

    const ctx = new Cell(this._doc, this, Object.assign({}, opts, {
      width: this._widths[column]
    }))
    this._begin(ctx)

    // move the cell to the right by the width of each previous cell
    for (let i = 0; i < column; ++i) {
      ctx._cursor.startX += this._widths[i] || 0
    }
    ctx._pending.push(() => ctx._start())

    // override cell's end logic, which is also postponed until the row ends
    ctx._end = endCell.bind(ctx, this)

    this._pending.push(ctx._pending)

    if (typeof text === 'string' && text.length > 0) {
      ctx.text(text, opts)
    }

    return ctx
  }
}

async function endCell(row) {
  // apply bottom padding
  this._cursor.y -= this.paddingBottom

  // decrease the counter of active cells
  row._columns--

  // reset the parent property, to prevent endless recursion when the pageBreak handler of the
  // cell is called later on
  this._parent = null

  // keep track of the ended cell
  row._endedCells.push(this)

  // if, last row has been ended, trigger page break manually to continue with other cells on
  // the next page
  if (row._columns > 0 && row._rotated === row._columns) {
    await row._pageBreak(2) // TODO: level hardcoded?
  }

  // keep track of the ending y which is nearest to the page end
  if (row._endY === null || this._cursor.y < row._endY) {
    row._endY = this._cursor.y
  }

  // move to the next cell
  row._nextColumn()
}
