'use strict'

const Fragment = require('./fragment')
const util = require('./util')
const ops = require('./ops')

module.exports = class Row {
  constructor(doc, cursor) {
    this._doc = doc
    this._cursor = cursor || doc._cursor
    this._ended = false

    this._cellEnds = []
    this._pendingCells = []

    this._pending = new Promise(resolve => this._enable = resolve)
  }

  async _beforeBreak() {

  }

  _afterBreak() {

  }

//   async _end() {
//     this._cursor.x = this._cursor.startX
//     // this._cursor.y = Math.min.apply(Math, this._childCursors.map(c => c.y))
//   }

  end() {
    return Fragment.prototype.end.call(this)
  }

  async _start(text, opts) {
    if (!this._doc._currentPage) {
      await this._doc._startPage()
    }

    const stashKey = this._cursor.saveStash()
    const y = this._cursor.y
    let i = 0

    const beforeBreak = async () => {
      if (this._pendingCells.length > 0) {
        const cell = this._pendingCells.shift()

        const cellStashKey = this._cursor.saveStash()

        this._cursor.startX += 200*(i++)
        this._cursor.x = this._cursor.startX
        this._cursor.y = y

        await cell._start(null, {})

        this._cursor.restoreStash(cellStashKey)
        this._cursor.deleteStash(cellStashKey)
        this._cellEnds.push(this._cursor.y)
      }
    }
    this._cursor.beforeBreak(beforeBreak)

    this._end = () => {
      this._cursor.restoreStash(stashKey)
      this._cursor.y = Math.min.apply(Math, this._cellEnds)
    }

    await beforeBreak()
  }

  startCell(text, opts) {
    if (text !== null && typeof text === 'object') {
      opts = text
      text = ''
    }
    if (!opts || typeof opts !== 'object') {
      opts = {}
    }

    const Cell = require('./cell')
    // Cell.prototype._beforeBreak = async () => {

    // }

    // TODO: opts
    const ctx = new Cell(this._doc)
    ctx._tmp_opts = opts

    this._pendingCells.push(ctx)

    // let y
    // this._doc._pending = this._doc._pending
    //   .then(() => {
    //     this._stashKey = this._cursor.saveStash()
    //     y = this._cursor.y
    //     return ctx._start(null, opts)
    //   })
      // .then(() => ctx._end())
      // .then(() => {
      //   this._cursor.restoreStash(this._stashKey)
      //   this._cursor.deleteStash(this._stashKey)
      //   this._cursor.startX += 200
      //   this._cursor.x += 200
      //   this._cellEnds.push(this._cursor.y)
      //   this._cursor.y = y
      // })

    return ctx
  }
}
