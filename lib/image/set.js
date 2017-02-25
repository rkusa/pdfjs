'use strict'

class ImageSet {
  constructor() {
    this._nextId = 1
  }

  nextId() {
    return 'I' + this._nextId++
  }
}

ImageSet.global = new ImageSet()

module.exports = ImageSet
