'use strict'

const PDFObject = require('./object')
const PDFArray = require('./array')

module.exports = class Pages extends PDFObject {
  constructor(width, height) {
    super('Pages')

    this.pages = []
    this.kids = new PDFArray()

    this.prop('MediaBox', new PDFArray([0, 0, width, height]))
    this.prop('Kids', this.kids)
    this.prop('Count', this.kids.length)
  }

  add(page) {
    this.pages.push(page)
    this.kids.push(page.toReference())
    this.prop('Count', this.kids.length)
  }
}
