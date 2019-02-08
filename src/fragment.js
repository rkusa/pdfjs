'use strict'

import Cursor from './cursor'
import ops from './ops'
import renderImage from './image/render'
import Base from './base'
import Text from './text'
import Cell from './cell'
import Table from './table'
import Header from './header'

const ALREADY_ENDED_ERROR = new Error('already ended')

export default class Fragment extends Base {
  constructor(doc, parent) {
    super(doc, parent)
  }

  /// public API

  text(text, opts) {
    if (text !== null && typeof text === 'object') {
      opts = text
      text = undefined
    }

    if (!opts || typeof opts !== 'object') {
      opts = {}
    }

    const ctx = new Text(this._doc, this, this._opts(opts))
    this._begin(ctx)

    ctx._pending.push(() => ctx._start())

    if (typeof text === 'string' && text.length > 0) {
      ctx.add(text)
    }

    return ctx
  }

  cell(text, opts) {
    if (text !== null && typeof text === 'object') {
      opts = text
      text = undefined
    }
    if (!opts || typeof opts !== 'object') {
      opts = {}
    }

    const ctx = new Cell(this._doc, this, this._opts(opts))
    this._begin(ctx)

    ctx._pending.push(() => ctx._start())
    this._pending.push(ctx._pending)

    if (typeof text === 'string' && text.length > 0) {
      ctx.text(text, opts)
    }

    return ctx
  }

  table(opts) {
    if (!opts || typeof opts !== 'object') {
      opts = {}
    }

    const ctx = new Table(this._doc, this, this._opts(opts))
    this._begin(ctx)

    return ctx
  }

  image(img, opts) {
    if (!opts || typeof opts !== 'object') {
      opts = {}
    }

    this._begin(null)
    this._pending.push(() => renderImage(img, this._doc, this, opts))
  }

  pageBreak() {
    this._begin(null)
    this._pending.push(() => this._parent._pageBreak(1))
  }

  op(fn) {
    this._begin(null)
    this._pending.push(async () => {
      if (!this._doc._currentContent) {
        await this._doc._startPage()
      }

      let args = arguments
      if (typeof fn === 'function') {
        args = fn(this._cursor.x, this._cursor.y)
        if (!Array.isArray(args)) {
          throw new TypeError('Return of .op(() => {}) must be an array')
        }
      }
      return this._doc._write(ops.write.apply(ops, args))
    })
  }

  destination(name) {
    this._begin(null)
    this._pending.push(async () => {
      const DestinationRangeStyle = Text.DestinationRangeStyle
      const self = {
        destination: name,
        doc: this._doc,
        from: this._cursor.x,
        y: this._cursor.y,
      }
      DestinationRangeStyle.prototype._applyStyle.call(self)
    })
  }
}

// rolupjs bundling does not support circular dependencies which is why we have to implement the
// following workaround

function fragmentify(c) {
  Object.assign(c.prototype, {
    text: Fragment.prototype.text,
    cell: Fragment.prototype.cell,
    table: Fragment.prototype.table,
    image: Fragment.prototype.image,
    pageBreak: Fragment.prototype.pageBreak,
    op: Fragment.prototype.op,
    destination: Fragment.prototype.destination,
  })
}

fragmentify(Cell)
fragmentify(Header)