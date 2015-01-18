'use strict'

var PDFObject = require('./object')
var PDFArray  = require('./array')

var Pages = module.exports = function(width, height) {
  PDFObject.call(this, 'Pages')

  this.pages = []
  this.kids  = new PDFArray()

  this.prop('MediaBox', new PDFArray([
    0, 0,
    width,
    height
  ]))
  this.prop('Kids',  this.kids)
  this.prop('Count', this.kids.length)
}

require('../utils').inherits(Pages, PDFObject)


Pages.prototype.add = function(page) {
  this.pages.push(page)
  this.kids.push(page.toReference())
  this.prop('Count', this.kids.length)
}

Pages.prototype.embed = function(doc) {
  doc.addObject(this)
  this.pages.forEach(function(page) {
    page.embed(doc)
  })
}
