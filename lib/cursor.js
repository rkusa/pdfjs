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

    this._stack = {
      width: [], x: [], startX: [], startY: [], bottom: [],
      _beforeBreakHandler: [], _afterBreakHandler: []
    }
  }

  get depth() {
    return this._stack.width.length
  }

  enter() {
    this._stack.width.push(this.width)
    this._stack.x.push(this.x)
    this._stack.startX.push(this.startX)
    this._stack.startY.push(this.startY)
    this._stack.bottom.push(this.bottom)
    this._stack._beforeBreakHandler.push(this._beforeBreakHandler)
    this._beforeBreakHandler = this._beforeBreakHandler.slice()
    this._stack._afterBreakHandler.push(this._afterBreakHandler)
    this._afterBreakHandler = this._afterBreakHandler.slice()
  }

  leave() {
    if (this._stack.width.length === 0) {
      throw new Error('There is nothing on the cursor stack to leave')
    }
    this.width = this._stack.width.pop()
    this.x = this._stack.x.pop()
    this.startX = this._stack.startX.pop()
    this.startY = this._stack.startY.pop()
    this.bottom = this._stack.bottom.pop()
    this._beforeBreakHandler = this._stack._beforeBreakHandler.pop()
    this._afterBreakHandler = this._stack._afterBreakHandler.pop()
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
