var PDFArray = require('./objects/array')
  , Page = require('./page')

var Pages = module.exports = function(doc) {
  this.doc   = doc
  this.tree  = this.doc.createObject('Pages')
  this.pages = []
  this.kids  = new PDFArray()

  this.tree.addProperty('MediaBox', new PDFArray([0, 0, doc.width, doc.height]))
  this.tree.addProperty('Kids',  this.kids)
  this.tree.addProperty('Count', this.count)
}

Object.defineProperty(Pages.prototype, 'count', {
  get: function() {
    return this.kids.length
  }
})

Pages.prototype.addPage = function() {
  var page = new Page(this.doc, this.tree)

  this.pages.push(page)
  this.kids.push(page.toReference())
  this.tree.addProperty('Count', this.count)

  this.doc.subsets.forEach(function(subset) {
    subset.addTo(page)
  })

  return page
}

Pages.prototype.removePageAt = function(index) {
  this.pages.splice(index, 1)
  this.kids.splice(index, 1)
  this.tree.addProperty('Count', this.count)
}

Pages.prototype.toReference = function() {
  return this.tree.toReference()
}