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
  }

  reset() {
    this.x = this.startX
    this.y = this.startY
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

  clone() {
    const clone = new this.constructor(this.width, this.height, this.startX, this.startY)
    clone.x = this.x
    clone.y = this.y
    clone.bottom = this.bottom
    clone._beforeBreakHandler = this._beforeBreakHandler.slice()
    clone._afterBreakHandler = this._afterBreakHandler.slice()
    return clone
  }

  beforeBreak(fn) {
    this._beforeBreakHandler.unshift(fn)
  }

  afterBreak(fn) {
    this._afterBreakHandler.unshift(fn)
  }
}
