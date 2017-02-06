'use strict'

class FontSet {
  constructor() {
    this._nextId = 1
  }

  nextId() {
    return 'F' + this._nextId++
  }
}

FontSet.global = new FontSet()

module.exports = FontSet
