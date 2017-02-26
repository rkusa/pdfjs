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
      let remainingWidth = this._cursor.width
      const distribute = []

      for (const i in opts.widths) {
        const w = opts.widths[i]
        if (!w || w === '*') {
          distribute.push(i)
          this.widths.push(0)
        } else {
          remainingWidth -= w
          this.widths.push(w)
        }
      }

      if (distribute.length > 0) {
        const w = remainingWidth / distribute.length

        for (const i of distribute) {
          this.widths[i] = w
        }
      }
    } else {
      throw new TypeError('widths (array) option is required for tables')
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
    ctx._pending.push(() => ctx._start(opts))

    this._pending.push(ctx._pending)

    return ctx
  }
}
