'use strict'

class Cursor {
  constructor(width, height, x, y) {
    this.width = width
    this.height = height
    if (x !== undefined) {
      this.startX = this.x = x
    }
    if (y !== undefined) {
      this.startY = this.y = y
      this.bottom = this.y - this.height
    }
  }

  reset() {
    this.x = this.startX
    this.y = this.startY
    this.bottom = this.y - this.height
  }

  doesFit(height) {
    return (this.y - height) > this.bottom
  }

  clone() {
    return new ClonedCursor(this)
  }
}

class ClonedCursor extends Cursor {
  constructor(cursor) {
    super(cursor.width, cursor.height)
    this.bottom = cursor.bottom
    this.startX = cursor.startX
    this.startY = cursor.startY
    this._root = cursor._root || cursor
  }

  get x() {
    return this._root.x
  }

  set x(val) {
    this._root.x = val
  }

  get y() {
    return this._root.y
  }

  set y(val) {
    this._root.y = val
  }
}

module.exports = Cursor
