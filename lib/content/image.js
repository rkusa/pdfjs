var Image = require('../image')

var PDFXObject = require('../objects/xobject')
var PDFStream     = require('../objects/stream')
var PDFArray      = require('../objects/array')
var PDFName       = require('../objects/name')


module.exports = exports = function(img, opts) {
	var image = new ImageInstance(this, img, opts)
  this.contents.push(image)
  return this
}

var ImageInstance = function(doc, img, opts) {
	this.image = img instanceof Image ? img : doc.createImage(img)
	this.opts = opts || {}
}

ImageInstance.prototype.render = function(page, width) {
	this.image.addTo(page)

	var width  = this.opts.width  || this.image.width
	var height = this.opts.height || this.image.height

	// page.cursor.y
	page.contents.writeLine('q') // save graphics state
	page.contents.writeLine(width + ' 0 0 ' + height + ' ' + page.cursor.x + ' ' + (page.cursor.y - height) + ' cm') // translate and scale
	page.contents.writeLine('/' + this.image.id + ' Do') // paint image
	page.contents.writeLine('Q') // restore graphics state
}


// ImageInstance.prototype.render = function(page, width, context) {
// 	this.addTo(page);
// 	var renderedWidth = this.opts.isBackground? page.doc.innerWidth : this.width;
// 	var renderedHeight = this.opts.isBackground? page.doc.innerHeight : this.height;
// 	var startY = (this.opts.isBackground? page.doc.padding.top:  page.cursor.y - renderedHeight);
// 	page.contents.writeLine("q " + renderedWidth + " 0 0 " + renderedHeight + " " + page.cursor.x + " " + startY + " cm /I" + this.id + " Do Q ")
// 	if(!this.opts.isBackground){
// 		page.cursor.y -=  this.height;
// 	}
// }
