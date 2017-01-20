'use strict'

const Cursor = require('./cursor')
const ops = require('./ops')
const util = require('./util')
const renderText = require('./text')

const ALREADY_ENDED_ERROR = new Error('already ended')

module.exports = class Fragment {
  constructor(doc, parent, cursor) {
    this._init(doc, parent, cursor)
  }

  _init(doc, parent, cursor) {
    this._doc = doc
    this._parent = parent
    this._cursor = cursor || parent._cursor
    this._ended = false

    this._pending = parent._pending
  }

  async _pageBreak() {
    if (this._parent) {
      await this._parent._pageBreak()
    }
  }

  async _beforeBreak() {
    // abstract
  }

  _afterBreak() {
    // abstract
  }

  _end() {
    // abstract
  }

  end() {
    if (this._ended) {
      throw ALREADY_ENDED_ERROR
    }

    this._ended = true
    this._pending.push(() => this._end())
  }

  text(text) {
    if (text) {
      this._pending.push(() => renderText.call(this, text, this))
    }
  }

  cell(text, opts) {
    if (text !== null && typeof text === 'object') {
      opts = text
      text = ''
    }
    if (!opts || typeof opts !== 'object') {
      opts = {}
    }

    const ctx = this.startCell(opts)
    ctx._pending.push(() => renderText.call(ctx, text, ctx))

    ctx.end()
  }

  startCell(opts) {
    if (!opts || typeof opts !== 'object') {
      opts = {}
    }

    const Cell = require('./cell')
    const ctx = new Cell(this._doc, this)
    ctx._pending.push(() => ctx._start(opts))

    this._pending.push(ctx._pending)

    return ctx
  }

  startRow(opts) {
    if (!opts || typeof opts !== 'object') {
      opts = {}
    }

    const Row = require('./row')
    const ctx = new Row(this._doc, this)
    ctx._pending.push(() => ctx._start(opts))

    this._pending.push(ctx._pending)

    return ctx
  }
}
