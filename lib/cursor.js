'use strict'

module.exports = class Cursor {
  constructor(width, height, x, y) {
    this.width = width
    this.height = height
    this.startX = this.x = x
    this.startY = this.y = y
    this.bottom = this.y - this.height
    this._beforeBreakHandler = []
    this._afterBreakHandler = []
    this._stash = {}
    this._key = Symbol()
  }

  saveStash() {
    const key = Symbol()
    this._stash[key] = {
      width: this.width,
      x: this.x,
      startX: this.startX,
      startY: this.startY,
      bottom: this.bottom,
      _beforeBreakHandler: this._beforeBreakHandler,
      _afterBreakHandler: this._afterBreakHandler,
    }
    this._beforeBreakHandler = this._beforeBreakHandler.slice()
    this._afterBreakHandler = this._afterBreakHandler.slice()
    this._key = key
    return key
  }

  restoreStash(key) {
    if (!(key in this._stash)) {
      throw new Error('Tried to restore nonexisting stash')
    }
    const stash = this._stash[key]
    this._key = key
    this.width = stash.width
    this.x = stash.x
    this.startX = stash.startX
    this.startY = stash.startY
    this.bottom = stash.bottom
    this._beforeBreakHandler = stash._beforeBreakHandler
    this._afterBreakHandler = stash._afterBreakHandler
  }

  deleteStash(key) {
    delete this._stash[key]
  }

  reset() {
    this.x = this.startX
    this.y = this.startY
    this.bottom = this.y - this.height
  }

  async break() {
    // Note; cannot use Promise.all, because parallel execution would create
    // invalid documents (objects inside objects)
    for (let i = 0; i < this._beforeBreakHandler.length; ++i) {
      await this._beforeBreakHandler[i]()
    }

    this.reset()
  }

  async prepare() {
    for (let i = 0; i < this._afterBreakHandler.length; ++i) {
      await this._afterBreakHandler[i]()
    }
  }

  doesFit(height) {
    return (this.y - height) > this.bottom
  }

  beforeBreak(fn) {
    this._beforeBreakHandler.unshift(fn)
  }

  afterBreak(fn) {
    this._afterBreakHandler.unshift(fn)
  }
}
