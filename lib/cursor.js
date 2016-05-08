'use strict'

module.exports = class Cursor {
  constructor(width, height, x, y) {
    this.width = width
    this.height = height
    this.startX = this.x = x
    this.startY = this.y = y
  }

  reset() {
    this.x = this.startX
    this.y = this.startY
  }
}
