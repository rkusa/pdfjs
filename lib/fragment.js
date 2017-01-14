'use strict'

const Cursor = require('./cursor')
const ops = require('./ops')
const util = require('./util')
const renderText = require('./text')

const ALREADY_ENDED_ERROR = new Error('already ended')

module.exports = class Fragment {
  constructor(doc, cursor) {
    this._doc = doc
    this._cursor = cursor || doc._cursor
    this._ended = false
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

    this._doc._pending = this._doc._pending.then(() => this._end())
    this._ended = true
  }

  text(text) {
    if (text) {
      this._doc._pending = this._doc._pending.then(() => renderText.call(this, text))
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

    const Cell = require('./cell')
    const ctx = new Cell(this._doc)

    this._doc._pending = this._doc._pending
      .then(() => ctx._start(text, opts))

    ctx.end()
  }

  startCell(opts) {
    if (!opts || typeof opts !== 'object') {
      opts = {}
    }

    const Cell = require('./cell')
    const ctx = new Cell(this._doc)

    this._doc._pending = this._doc._pending
      .then(() => ctx._start(null, opts))

    return ctx
  }

  startRow(opts) {
    if (!opts || typeof opts !== 'object') {
      opts = {}
    }

    const Row = require('./row')
    const ctx = new Row(this._doc)

    this._doc._pending = this._doc._pending.then(() => ctx._start(opts))

    return ctx
  }
}
