'use strict'

module.exports = class Cursor {
  constructor(width, height, x, y) {
    this.width = width
    this.height = height
    this.startX = this.x = x
    this.startY = this.y = y
    this.bottom = this.y - this.height
  }

  reset() {
    this.x = this.startX
    this.y = this.startY
  }

  doesFit(height) {
    return (this.y - height) > this.bottom
  }
}
