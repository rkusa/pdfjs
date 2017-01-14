'use strict'

const Cursor = require('./cursor')
const ops = require('./ops')
const util = require('./util')
const renderText = require('./text')

const ALREADY_ENDED_ERROR = new Error('already ended')

module.exports = class Fragment {
  constructor(doc) {
    this._doc = doc
    this._ended = false
  }

  get _cursor() {
    return this._doc._cursor
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
    const ctx = new Cell(this._doc, this._cursor)

    this._doc._pending = this._doc._pending
      .then(() => ctx._start(text, opts))

    ctx.end()
  }

  startCell(opts) {
    if (!opts || typeof opts !== 'object') {
      opts = {}
    }

    const Cell = require('./cell')
    const ctx = new Cell(this._doc, this._cursor)

    this._doc._pending = this._doc._pending
      .then(() => ctx._start(null, opts))

    return ctx
  }

  row(fn, opts) {
    if (!opts || typeof opts !== 'object') {
      opts = {}
    }

    // if (typeof fn !== 'function') {
    //   throw TypeError('expected a function, got a ', typeof fn)
    // }

    this._doc._pending = this._doc._pending.then(() => this._doc._row(fn, opts))
  }

  async _row(fn, opts) {
    if (!this._doc._currentPage) {
      await this._doc._startPage()
    }

    await Promise.all(fn.map(txt => this._cell(txt, {})))

//     let pending = RESOLVE

//     // await this._inner(fn)
//     fn.forEach(txt => {
//       const cell = this._cell(txt, {})

//       // console.log('set')
//       // this._pending = this._pending.then(cell)

//       pending = pending.then(() => cell)
//     })

//     await pending
  }
}
