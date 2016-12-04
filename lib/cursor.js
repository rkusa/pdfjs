'use strict'

module.exports = class Cursor {
  constructor(width, height, x, y) {
    this.width = width
    this.height = height
    this.startX = this.x = x
    this.startY = this.y = y
    this.bottom = this.y - this.height
    this._beforeBreakHandler = []
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

  doesFit(height) {
    return (this.y - height) > this.bottom
  }

  clone() {
    const clone = new this.constructor(this.width, this.height, this.startX, this.startY)
    clone.x = this.x
    clone.y = this.y
    clone.bottom = this.bottom
    clone._beforeBreakHandler = this._beforeBreakHandler.slice()
    return clone
  }

  beforeBreak(fn) {
    this._beforeBreakHandler.unshift(fn)
  }
}
