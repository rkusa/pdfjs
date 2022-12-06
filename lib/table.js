'use strict'

const Fragment = require('./fragment')
const util = require('./util')
const ops = require('./ops')
const PDF = require('./object')

module.exports = class Table {
  constructor(doc, parent, opts) {
    Fragment.prototype._init.call(this, doc, parent)

    this._cursor = this._cursor.clone()
    if ('width' in opts) {
      this._cursor.width = opts.width
    }

    this._rowCount = 0
    this.widths = []

    applyOpts.call(this, opts)

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

    this._headers = []
    // reference to the last header context
    //  only defined for tables with exclusively headers
    this._last_header_cxt = null
    this._is_header_rendered = false
  }

  /// private API

  async _pageBreak(level, insideBreak) {
    await Fragment.prototype._pageBreak.call(this, level)

    if (!insideBreak) {
      await this._renderHeader(true)
    }
  }

  async _end() {
    // render headers if there are no rows
    if (!this._is_header_rendered && this._headers.length) {
      this._pending.push(() => this._renderHeader())
    }
    await Fragment.prototype._end.call(this)
  }

  _begin(ctx) {
    Fragment.prototype._begin.call(this, ctx)
  }

  async _renderHeader(isPageBreak) {
    if (!this._headers.length) {
      return
    }

    if (!this._doc._currentContent) {
      await this._doc._startPage()
    }

    const headerHeight = this._headers.reduce((total, header) => total + header.height, 0)

    if (!isPageBreak && !this._cursor.doesFit(headerHeight)) {
      await this._pageBreak(1, false)
      return
    }

    let chunk = ''

    for (const header of this._headers) {
      const offset = this._cursor.y - header.startedAtY
      if (offset !== 0) {
        // offset header to the top
        chunk += ops.q()
            + ops.cm(1, 0, 0, 1, 0, offset)
      }

      for (const obj of header._objects) {
        const alias = new PDF.Name('TH' + obj.id)
        this._doc._currentContent._xobjects[alias] = obj.toReference()
        chunk += ops.Do(alias)
      }

      this._cursor.y -= header.height

      if (offset !== 0) {
        chunk += ops.Q()
      }
    }


    await this._doc._write(chunk)
    this._is_header_rendered = true;
  }

  _row(opts, isHeader) {
    if (!opts || typeof opts !== 'object') {
      opts = {}
    }

    opts = Object.assign({
      font: this._doc.defaultFont,
      fontSize: this._doc.defaultFontSize,
      color: this._doc.defaultColor,
      lineHeight: this._doc.defaultLineHeight,
    }, this.opts, opts)

    // whitelist
    opts = {
      padding: opts.padding,
      paddingLeft: opts.paddingLeft,
      paddingRight: opts.paddingRight,
      paddingTop: opts.paddingTop,
      paddingBottom: opts.paddingBottom,
      backgroundColor: opts.backgroundColor,
      font: opts.font,
      fontSize: opts.fontSize,
      color: opts.color,
      lineHeight: opts.lineHeight,
      minHeight: opts.minHeight,
    }

    const Row = isHeader ? require('./tableheader') : require('./row')
    const ctx = new Row(this._doc, this, opts)
    this._last_header_cxt = isHeader ? ctx : null
    this._begin(ctx)

    ctx._widths = this.widths.slice()
    ctx._borderVerticalWidths = this.borderVerticalWidths && this.borderVerticalWidths.slice()
    ctx._borderVerticalColors = this.borderVerticalColors && this.borderVerticalColors.slice()

    if (this.borderHorizontalWidths) {
      ctx._topBorderWidth = this.borderHorizontalWidths(this._rowCount)
      ctx._topBorderColor = util.colorToRgb(this.borderHorizontalColors(this._rowCount))

      if (!isHeader) {
        ctx._bottomBorderWidth = this.borderHorizontalWidths(this._rowCount + 1)
        ctx._bottomBorderColor = util.colorToRgb(this.borderHorizontalColors(this._rowCount + 1))
      }

      // should have a top border if there are only header rows in the table
      ctx._hasTopBorder = this._rowCount === (this._headers.length)
    }

    ctx._pending.push(() => ctx._start())
    this._pending.push(ctx._pending)

    this._rowCount++

    return ctx
  }

  /// public API

  end() {
    // if the table only has headers, add a bottom border to the last header row
    if (!this._is_header_rendered && this._last_header_cxt && this.borderHorizontalWidths) {
      this._last_header_cxt._bottomBorderWidth = this.borderHorizontalWidths(this._rowCount)
      this._last_header_cxt._bottomBorderColor = util.colorToRgb(this.borderHorizontalColors(this._rowCount))
    }
    return Fragment.prototype.end.call(this)
  }

  row(opts) {
    // Defer rendering of the headers until either a row is added or _end
    if (this._rowCount === this._headers.length) {
      this._pending.push(() => this._renderHeader())
    }
    return this._row(opts, false)
  }

  header(opts) {
    // Can only add more headers if there are no rows added yet
    if (this._rowCount > this._headers.length) {
        throw new Error('The table already has rows, cannot add additional headers')
    }
    const ctx = this._row(opts, true)
    this._headers.push(ctx)
    return ctx
  }
}

function applyOpts(opts) {
  this.opts = opts

  // opts.width
  if ('widths' in opts && Array.isArray(opts.widths)) {
    this.widths = opts.widths
  } else {
    throw new TypeError('widths (array) option is required for tables')
  }

  // opts.borderVerticalWidths
  this.borderVerticalWidths = null
  if (opts.borderVerticalWidths) {
    if (!Array.isArray(opts.borderVerticalWidths)) {
      throw new TypeError('borderVerticalWidths must be an array')
    }

    if (opts.borderVerticalWidths.length !== this.widths.length + 1) {
      throw new TypeError(`wrong borderVerticalWidths length (expected ${this.widths.length + 1}; got ${opts.borderVerticalWidths.length})`)
    }

    this.borderVerticalWidths = opts.borderVerticalWidths
  }
  // opts.borderVerticalWidth
  else if (typeof opts.borderVerticalWidth === 'number') {
    this.borderVerticalWidths = []
    for (let i = 0; i <= this.widths.length; ++i) {
      this.borderVerticalWidths.push(opts.borderVerticalWidth)
    }
  }

  // opts.borderVerticalColors
  this.borderVerticalColors = null
  if (opts.borderVerticalColors) {
    if (!Array.isArray(opts.borderVerticalColors)) {
      throw new TypeError('borderVerticalColors must be an array')
    }

    if (opts.borderVerticalColors.length !== this.widths.length + 1) {
      throw new TypeError(`wrong borderVerticalColors length (expected ${this.widths.length + 1}; got ${opts.borderVerticalColors.length})`)
    }

    this.borderVerticalColors = opts.borderVerticalColors.map(c => util.colorToRgb(c))
  }
  // opts.borderVerticalColor
  else if (typeof opts.borderVerticalColor === 'number') {
    this.borderVerticalColors = []
    const color = util.colorToRgb(opts.borderVerticalColor)
    for (let i = 0; i <= this.widths.length; ++i) {
      this.borderVerticalColors.push(color)
    }
  }

  // opts.borderHorizontalWidths
  this.borderHorizontalWidths = null
  if (opts.borderHorizontalWidths) {
    if (typeof opts.borderHorizontalWidths !== 'function') {
      throw new TypeError('borderHorizontalWidths must be a function')
    }

    this.borderHorizontalWidths = opts.borderHorizontalWidths
  }
  // opts.borderHorizontalWidth
  else if (typeof opts.borderHorizontalWidth === 'number') {
    this.borderHorizontalWidths = () => opts.borderHorizontalWidth
  }

  // opts.borderHorizontalColors
  this.borderHorizontalColors = null
  if (opts.borderHorizontalColors) {
    if (typeof opts.borderHorizontalColors !== 'function') {
      throw new TypeError('borderHorizontalColors must be a function')
    }

    this.borderHorizontalColors = opts.borderHorizontalColors
  }
  // opts.borderHorizontalColor
  else if (typeof opts.borderHorizontalColor === 'number') {
    this.borderHorizontalColors = () => opts.borderHorizontalColor
  }

  // opts.borderWidth
  const borderWidth = opts.borderWidth || 0
  if (borderWidth > 0) {
    if (!this.borderVerticalWidths) {
      this.borderVerticalWidths = []
      for (let i = 0; i <= this.widths.length; ++i) {
        this.borderVerticalWidths.push(borderWidth)
      }
    }

    if (!this.borderHorizontalWidths) {
      this.borderHorizontalWidths = () => borderWidth
    }
  }

  // opts.borderColor
  const borderColor = opts.borderColor || 0x000000
  if (!this.borderVerticalColors) {
    this.borderVerticalColors = []
    for (let i = 0; i <= this.widths.length; ++i) {
      this.borderVerticalColors.push(util.colorToRgb(borderColor))
    }
  }

  if (!this.borderHorizontalColors) {
    this.borderHorizontalColors = () => borderColor
  }
}
