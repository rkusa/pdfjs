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
    await Promise.all(this._beforeBreakHandler.map(fn => fn()))

    this.reset()
  }

  doesFit(height) {
    return (this.y - height) > this.bottom
  }

  clone() {
    const clone = new this.constructor(this.width, this.height, this.startX, this.startY)
    clone.x = this.x
    clone.y = this.y
    clone._beforeBreakHandler = this._beforeBreakHandler.slice()
    return clone
  }

  beforeBreak(fn) {
    this._beforeBreakHandler.push(fn)
  }
}
