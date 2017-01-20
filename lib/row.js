'use strict'

const Fragment = require('./fragment')
const util = require('./util')
const ops = require('./ops')

module.exports = class Row {
  constructor(doc, parent, cursor) {
    Fragment.prototype._init.call(this, doc, parent, cursor)

    this._pending = []
    this._rotated = 0
    this._y = 0
    this._startX = 0
  }

  async _pageBreak() {
    console.log('pageBreakAllowed', this._rotated, this._pending.length)

    this._pending.splice(this._pending.length - 2, 0 , this._pending.shift())

    // -1 because of row._end
    // -1 because we want a page break ont he last column
    if (this._rotated < this._pending.length - 2) {
      this._rotated++

      this._cursor.y = this._y
      this._cursor.startX += 200
      this._cursor.x = this._cursor.startX
    } else {
      this._rotated = 0
      await this._parent._pageBreak()

      this._y = this._cursor.y
      this._cursor.startX = this._startX
    }
  }

  async _end() {
    // this._cursor.x = this._cursor.startX
    // this._cursor.y = Math.min.apply(Math, this._childCursors.map(c => c.y))

    this._cursor.startX = this._startX

  }

  end() {
    return Fragment.prototype.end.call(this)
  }

  async _start(text, opts) {
    if (!this._doc._currentPage) {
      await this._doc._startPage()
    }

    this._pending.forEach(p => {
      if (Array.isArray(p)) {
        p.push(() => {
          this._cursor.startX += 200
          this._cursor.x = this._cursor.startX
          this._cursor.y = this._y
          return Promise.resolve()
        })
      }
    })

    this._y = this._cursor.y
    this._startX = this._cursor.startX

    // let i = 0

    // const beforeBreak = async () => {
    //   if (this._pendingCells.length > 0) {
    //     const cell = this._pendingCells.shift()

    //     const cellStashKey = this._cursor.saveStash()

    //     this._cursor.startX += 200*(i++)
    //     this._cursor.x = this._cursor.startX
    //     this._cursor.y = y

    //     await cell._start(null, {})

    //     this._cursor.restoreStash(cellStashKey)
    //     this._cursor.deleteStash(cellStashKey)
    //     this._cellEnds.push(this._cursor.y)
    //   }
    // }
    // this._cursor.beforeBreak(beforeBreak)

    // this._end = () => {
    //   this._cursor.restoreStash(stashKey)
    //   this._cursor.y = Math.min.apply(Math, this._cellEnds)
    // }

    // await beforeBreak()
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
    const ctx = new Cell(this._doc, this)
    ctx._pending.push(() => ctx._start(opts))

    this._pending.push(ctx._pending)

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
