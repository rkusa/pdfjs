var PDFObject = require('./object')
var PDFStream = require('./stream')
var PDFArray  = require('./array')
var PDFName   = require('./name')
var utils     = require('../utils')

var PDFFormXObject = module.exports = function(id, img) {
  this.alias = new PDFName('FXO' + id)
  this.img = img

  PDFObject.call(this, id)

  this.resources = img.info.page.get('Resources')

  this.prop('Type', 'XObject')
  this.prop('Subtype', 'Form')
  this.prop('FormType', 1)
  this.prop('BBox', new PDFArray([0, 0, img.info.width, img.info.height]))
  this.prop('Resources', this.resources instanceof PDFObject ? this.resources.toReference() : this.resources)

  var contents = img.info.page.get('Contents').object
  this.content = new PDFStream(this)
  this.content.content = contents.content.content

  if (contents.properties.has('Filter')) {
    this.prop('Filter', contents.properties.get('Filter'))
  }
  this.prop('Length',  contents.properties.get('Length'))
  if (contents.properties.has('Length1')) {
    this.prop('Length1', contents.properties.get('Length1'))
  }

  this.objects = []
  this.addObjectsRecursive(this)
}

utils.inherits(PDFFormXObject, PDFObject)

PDFFormXObject.prototype.embed = function(doc) {
  doc.addObject(this)

  this.objects.forEach(function(obj) {
    doc.addObject(obj)
  })
}

var PDFDictionary = require('../object/dictionary')
var PDFReference  = require('../object/reference')

PDFFormXObject.prototype.addObjectsRecursive = function(value) {
  switch (true) {
    case value instanceof PDFReference:
      if (this.objects.indexOf(value.object) > -1) {
        break
      }
      this.objects.push(value.object)
      this.addObjectsRecursive(value.object)
      break
    case value instanceof PDFObject:
      this.addObjectsRecursive(value.properties)
      this.addObjectsRecursive(value.content)
      break
    case value instanceof PDFDictionary:
      for (var key in value.dictionary) {
        this.addObjectsRecursive(value.dictionary[key])
      }
      break
    case Array.isArray(value):
      value.forEach(function(item) {
        this.addObjectsRecursive(item)
      }, this)
      break
  }
}
