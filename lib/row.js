'use strict'

const Fragment = require('./fragment')
const util = require('./util')
const ops = require('./ops')

module.exports = class Row {
  constructor(doc, parent) {
    Fragment.prototype._init.call(this, doc, parent)

    this._pending = []
    this._rotated = 0
    this._y = 0
    this._startX = 0
    this._endY = null
    // TODO: do not hardcode widths
    this._widths = [200, 200, 200, 200]
    this._columns = 0
  }

  async _pageBreak(level) {
    this._pending.splice(this._pending.length - 2, 0 , this._pending.shift())

    if (this._rotated < this._columns - 1) {
      this._rotated++

      this.nextColumn()

      return false
    } else {
      this._rotated = 0
      await this._parent._pageBreak(level + 1)

      this._y = this._cursor.y
      this._cursor.startX = this._startX
    }
  }

  nextColumn() {
    // this._cursor.startX += 200
    // this._cursor.x = this._cursor.startX
    this._cursor.y = this._y
  }

  async _end() {
    // reset cursor
    this._cursor.startX = this._cursor.x = this._startX
    this._cursor.y = this._endY
  }

  end() {
    return Fragment.prototype.end.call(this)
  }

  async _start(text, opts) {
    if (!this._doc._currentPage) {
      await this._doc._startPage()
    }

    this._pending.forEach(p => {
      if (Array.isArray(p)) {
        p.push(() => {
          if (this._endY === null || this._cursor.y < this._endY) {
            this._endY = this._cursor.y
          }
          this.nextColumn()
          return Promise.resolve()
        })
      }
    })

    this._y = this._cursor.y
    this._startX = this._cursor.startX
  }

  startCell(text, opts) {
    if (text !== null && typeof text === 'object') {
      opts = text
      text = ''
    }
    if (!opts || typeof opts !== 'object') {
      opts = {}
    }

    const Cell = require('./cell')

    const column = this._columns++
    const ctx = new Cell(this._doc, this, Object.assign({}, opts, {
      width: this._widths[column]
    }))

    ctx._cursor.startX += this._widths[column - 1] || 0
    ctx._pending.push(() => ctx._start())

    // override cell's _end to take align all the row's cells bottom
    ctx._end = endCell.bind(ctx, this)

    this._pending.push(ctx._pending)

    return ctx
  }
}

async function endCell(row) {
  row._columns--

  // apply bottom padding (but only for the most inner cell or or last background)
  this._cursor.y -= this.padding

  // create final createBackground
  // await this._createBackground()
  row._pending.splice(row._pending.length - 1, 0, () => {
    this._cursor.y = row._endY
    return this._createBackground()
  })
}
