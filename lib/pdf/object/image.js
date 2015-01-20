'use strict'

var PDFXObject    = require('../object/xobject')
var PDFArray      = require('../object/array')
var PDFName       = require('../object/name')
var utils         = require('../utils')

var Image = module.exports = function(id, img) {
  this.alias = new PDFName('I' + id)
  this.img = img

  PDFXObject.call(this)
  this.prop('Subtype', 'Image')
  this.prop('Width',  img.info.width)
  this.prop('Height', img.info.height)
  this.prop('ColorSpace', img.colorSpace)
  this.prop('BitsPerComponent', 8)
}

utils.inherits(Image, PDFXObject)

Image.prototype.embed = function(doc) {
  var src = this.img.image.img.src
  var hex = utils.asHex(src)
  this.prop('Filter', new PDFArray(['/ASCIIHexDecode', '/DCTDecode']))
  this.prop('Length', hex.length + 1)
  this.prop('Length1', src.byteLength)
  this.content.content = hex + '>\n'

  doc.addObject(this)
}
