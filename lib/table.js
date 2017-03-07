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

    this._rowCount = 0
    this.widths = []

    if ('widths' in opts && Array.isArray(opts.widths)) {
      this.widths = opts.widths
    } else {
      throw new TypeError('widths (array) option is required for tables')
    }

    this.borderVerticalWidths = null
    if (opts.borderVerticalWidths) {
      if (!Array.isArray(opts.borderVerticalWidths)) {
        throw new TypeError('borderVerticalWidths must be an array')
      }

      if (opts.borderVerticalWidths.length !== this.widths.length + 1) {
        throw new TypeError(`wrong borderVerticalWidths length (expected ${this.widths.length + 1}; got ${opts.borderVerticalWidths.length})`)
      }

      this.borderVerticalWidths = opts.borderVerticalWidths
    } else if (typeof opts.borderVerticalWidth === 'number') {
      this.borderVerticalWidths = []
      for (let i = 0; i <= this.widths.length; ++i) {
        this.borderVerticalWidths.push(opts.borderVerticalWidth)
      }
    }

    this.borderVerticalColors = null
    if (opts.borderVerticalColors) {
      if (!Array.isArray(opts.borderVerticalColors)) {
        throw new TypeError('borderVerticalColors must be an array')
      }

      if (opts.borderVerticalColors.length !== this.widths.length + 1) {
        throw new TypeError(`wrong borderVerticalColors length (expected ${this.widths.length + 1}; got ${opts.borderVerticalColors.length})`)
      }

      this.borderVerticalColors = opts.borderVerticalColors.map(c => util.colorToRgb(c))
    } else if (typeof opts.borderVerticalColor === 'number') {
      this.borderVerticalColors = []
      const color = util.colorToRgb(opts.borderVerticalColor)
      for (let i = 0; i <= this.widths.length; ++i) {
        this.borderVerticalColors.push(color)
      }
    }

    this.borderHorizontalWidths = null
    if (opts.borderHorizontalWidths) {
      if (typeof opts.borderHorizontalWidths !== 'function') {
        throw new TypeError('borderHorizontalWidths must be a function')
      }

      this.borderHorizontalWidths = opts.borderHorizontalWidths
    } else if (typeof opts.borderHorizontalWidth === 'number') {
      this.borderHorizontalWidths = () => opts.borderHorizontalWidth
    }

    this.borderHorizontalColors = null
    if (opts.borderHorizontalColors) {
      if (typeof opts.borderHorizontalColors !== 'function') {
        throw new TypeError('borderHorizontalColors must be a function')
      }

      this.borderHorizontalColors = opts.borderHorizontalColors
    } else if (typeof opts.borderHorizontalColor === 'number') {
      this.borderHorizontalColors = () => opts.borderHorizontalColor
    }

    this.borderWidth = opts.borderWidth || 0
    if (this.borderWidth > 0) {
      if (!this.borderVerticalWidths) {
        this.borderVerticalWidths = []
        for (let i = 0; i <= this.widths.length; ++i) {
          this.borderVerticalWidths.push(this.borderWidth)
        }
      }

      if (!this.borderHorizontalWidths) {
        this.borderHorizontalWidths = () => this.borderWidth
      }
    }

    this.borderColor = util.colorToRgb(opts.borderColor || 0x000000)
    if (!this.borderVerticalColors) {
      this.borderVerticalColors = []
      for (let i = 0; i <= this.widths.length; ++i) {
        this.borderVerticalColors.push(this.borderColor)
      }
    }

    if (this.borderVerticalWidths) {
      this._cursor.width -= this.borderVerticalWidths[0] / 2
      this._cursor.startX += this.borderVerticalWidths[0] / 2
      this._cursor.width -= this.borderVerticalWidths[this.borderVerticalWidths.length - 1] / 2
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

  row() {
    const Row = require('./row')
    const ctx = new Row(this._doc, this)
    this._begin(ctx)

    ctx._widths = this.widths.slice()
    ctx._borderVerticalWidths = this.borderVerticalWidths && this.borderVerticalWidths.slice()
    ctx._borderVerticalColors = this.borderVerticalColors && this.borderVerticalColors.slice()
    ctx._borderVerticalWidths = this.borderVerticalWidths && this.borderVerticalWidths.slice()

    if (this.borderHorizontalWidths) {
      if (this._rowCount === 0) {
        ctx._topBorderWidth = this.borderHorizontalWidths(0)
      }
      ctx._bottomBorderWidth = this.borderHorizontalWidths(this._rowCount + 1)
    }

    if (this.borderHorizontalColors) {
      if (this._rowCount === 0) {
        ctx._topBorderColor = util.colorToRgb(this.borderHorizontalColors(0))
      }
      ctx._bottomBorderColor = util.colorToRgb(this.borderHorizontalColors(this._rowCount + 1))
    } else {
      ctx._topBorderColor = ctx._bottomBorderColor = this.borderColor
    }

    ctx._pending.push(() => ctx._start())
    this._pending.push(ctx._pending)

    this._rowCount++

    return ctx
  }
}
