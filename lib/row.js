'use strict'

const Fragment = require('./fragment')
const util = require('./util')
const ops = require('./ops')

module.exports = class Row {
  constructor(doc, cursor) {
    this._doc = doc
    this._cursor = cursor || doc._cursor
    this._ended = false

    this._childCursors = []
  }

  async _beforeBreak() {

  }

  _afterBreak() {

  }

  async _end() {
    this._cursor.x = this._cursor.startX
    this._cursor.y = Math.min.apply(Math, this._childCursors.map(c => c.y))
  }

  end() {
    return Fragment.prototype.end.call(this)
  }

  async _start(text, opts) {
    if (!this._doc._currentPage) {
      await this._doc._startPage()
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
    const cursor = this._cursor.fork()
    cursor.startX = this._cursor.x
    this._childCursors.push(cursor)
    const ctx = new Cell(this._doc, cursor)

    this._cursor.x += 200

    this._doc._pending = this._doc._pending
      .then(() => ctx._start(text, opts))

    ctx.end()
  }
}
