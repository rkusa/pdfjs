'use strict'

const PDFName = require('./name')

module.exports = class PDFDictionary {
  constructor(dictionary) {
    this.dictionary = {}
    if (dictionary) {
      for (const key in dictionary) {
        this.add(key, dictionary[key])
      }
    }
  }

  add(key, val) {
    this.dictionary[new PDFName(key)] = typeof val === 'string' ? new PDFName(val) : val
  }

  set(key, val) {
    this.add(key, val)
  }

  has(key) {
    return String(new PDFName(key)) in this.dictionary
  }

  get(key) {
    return this.dictionary(new PDFName(key))
  }

  get length() {
    let length = 0
    for (const key in this.dictionary) {
      length++
    }
    return length
  }

  toString() {
    let str = ''
    for (const key in this.dictionary) {
      const val = this.dictionary[key]
      str += `${key} ${val === null ? 'null' : val}`.replace(/^/gm, '\t') + '\n'
    }
    return `<<\n${str}>>`
  }
}
