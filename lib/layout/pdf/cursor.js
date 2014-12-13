'use strict'

var PageBreakNode = require('../pdf/nodes/pagebreak')

var Cursor = module.exports = function(doc) {
  var padding       = doc.style.padding || 0
  var paddingLeft   = doc.style.paddingLeft   || padding
  var paddingTop    = doc.style.paddingTop    || padding
  var paddingRight  = doc.style.paddingRight  || padding
  var paddingBottom = doc.style.paddingBottom || padding

  this.width  = doc.style.width
  this.height = doc.style.height

  this.innerWidth = this.width - paddingLeft - paddingRight
  this.top        = this.height - paddingTop
  this.bottom     = paddingBottom

  this.currentPage = 1
  this.pageCount   = 1

  this.nextPageBreakId = 1
  this.validPageBreakId = null

  this.force = true

  this.x = paddingLeft
  this.y = this.top
}

Cursor.prototype.reset = function() {
  this.force = false
  this.y     = this.top

  this.currentPage = 1
  this.validPageBreakId = null
}

Cursor.prototype.pageBreak = function(pageBreak) {
  if (!pageBreak) {
    pageBreak = new PageBreakNode(this.nextPageBreakId++)
    pageBreak.page = this.currentPage
  } else {
    console.log(this.validPageBreakId, pageBreak.id)
    if (this.validPageBreakId && pageBreak.id < this.validPageBreakId) {
      return null
    }

    this.validPageBreakId = pageBreak.id
  }

  if (++this.currentPage > this.pageCount) {
    this.pageCount++
  }

  this.y = this.top

  return pageBreak
}
