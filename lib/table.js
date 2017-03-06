'use strict'

const Fragment = require('./fragment')
const util = require('./util')
const ops = require('./ops')

module.exports = class Table {
  constructor(doc, parent, opts) {
    Fragment.prototype._init.call(this, doc, parent)

    this._cursor = this._cursor.clone()
    if ('width' in opts) {
      this._cursor.width = opts.width
    }

    this.widths = []

    if ('widths' in opts && Array.isArray(opts.widths)) {
      this.widths = opts.widths
    } else {
      throw new TypeError('widths (array) option is required for tables')
    }

    this.borderWidths = null
    if (opts.borderWidths) {
      if (!Array.isArray(opts.borderWidths)) {
        throw new TypeError('borderWidths must be an array')
      }

      if (this.borderWidths.length !== this.widths.length + 1) {
        throw new TypeError(`wrong borderWidths length (expected ${this.widths.length + 1}; got ${this.borderWidths.length})`)
      }

      this.borderWidths = opts.borderWidths
    } else if (!this.borderWidths && opts.borderWidth > 0) {
      this.borderWidths = []
      for (let i = 0; i <= this.widths.length; ++i) {
        this.borderWidths.push(opts.borderWidth)
      }
    }

    if (this.borderWidths) {
      this._cursor.width -= this.borderWidths[0] / 2
      this._cursor.startX += this.borderWidths[0] / 2
      this._cursor.width -= this.borderWidths[this.borderWidths.length - 1] / 2
    }

    // distribute remaining width among *-columns
    let remainingWidth = this._cursor.width
    const distribute = []

    for (const i in this.widths) {
      const w = this.widths[i]
      if (!w || w === '*') {
        distribute.push(i)
      } else {
        remainingWidth -= w
      }
    }

    if (distribute.length > 0) {
      const w = remainingWidth / distribute.length

      for (const i of distribute) {
        this.widths[i] = w
      }
    }
  }

  /// private API

  async _pageBreak(level) {
    await Fragment.prototype._pageBreak.call(this, level)
  }

  async _end() {
    await Fragment.prototype._end.call(this)
  }

  _begin(ctx) {
    Fragment.prototype._begin.call(this, ctx)
  }

  /// public API

  end() {
    return Fragment.prototype.end.call(this)
  }

  row(opts) {
    if (!opts || typeof opts !== 'object') {
      opts = {}
    }

    const Row = require('./row')
    const ctx = new Row(this._doc, this)
    this._begin(ctx)

    ctx._widths = this.widths.slice()
    ctx._borderWidths = this.borderWidths && this.borderWidths.slice()
    ctx._pending.push(() => ctx._start(opts))

    this._pending.push(ctx._pending)

    return ctx
  }
}
