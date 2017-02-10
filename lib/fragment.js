'use strict'

const Cursor = require('./cursor')
const ops = require('./ops')
const util = require('./util')

const ALREADY_ENDED_ERROR = new Error('already ended')

module.exports = class Fragment {
  constructor(doc, parent) {
    this._init(doc, parent)
  }

  /// private API

  _init(doc, parent) {
    this._doc = doc
    this._parent = parent
    this._cursor = parent._cursor
    this._ended = false

    this._pending = parent._pending
  }

  async _pageBreak(level) {
    if (this._parent) {
       await this._parent._pageBreak(level + 1)
    }
  }

  async _end() {
    // abstract
  }

  /// public API

  end() {
    if (this._ended) {
      throw ALREADY_ENDED_ERROR
    }

    this._ended = true
    this._pending.push(() => this._end())
  }

  text(text, opts) {
    if (!opts || typeof opts !== 'object') {
      opts = {}
    }

    const ctx = this.startText(opts)
    ctx.add(text)

    ctx.end()
  }

  startText(opts) {
    if (!opts || typeof opts !== 'object') {
      opts = {}
    }

    const Text = require('./text')
    const ctx = new Text(this._doc, this, opts)
    ctx._pending.push(() => ctx._start())

    return ctx
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
    ctx.text(text, opts)

    ctx.end()
  }

  startCell(opts) {
    if (!opts || typeof opts !== 'object') {
      opts = {}
    }

    const Cell = require('./cell')
    const ctx = new Cell(this._doc, this, opts)
    ctx._pending.push(() => ctx._start())

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
