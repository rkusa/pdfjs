'use strict'

var PDFObject  = require('./object/object')
var PDFXObject = require('./object/xobject')
var Pages      = require('./object/pages')
var Page       = require('./object/page')
// var Font       = require('./font')
// var Image      = require('./image')
var utils      = require('./utils')

var PDF = module.exports = function PDF(doc) {
  this.doc = doc

  this.version = 1.3
}

// PDF.prototype.registerFont = function(font) {
//   var index
//   if ((index = this.fonts.indexOf(font)) > -1) return this.subsets[index]
//   var id = this.fonts.push(font)
//   this.subsets.push(font.subset(this, id))
//   return this.subsets[id - 1]
// }

PDF.prototype.addObject = function(object) {
  this.objects.push(object)
}

PDF.prototype.createObject = function(type) {
  var object = new PDFObject()
  if (type) object.addProperty('Type', type)
  this.addObject(object)
  return object
}

// PDF.prototype.createXObject = function(subtype) {
//   var xobject = new PDFXObject()
//   if (subtype) xobject.addProperty('Subtype', subtype)
//   this.addObject(xobject)
//   return xobject
// }

// PDF.prototype.createImage = function(data) {
//   var image = new Image('Im' + (this.images.length + 1), data)
//   this.images.push(image)
//   this.addObject(image.xobject)
//   return image
// }

PDF.prototype.createPage = function() {
  var page = this.currentPage = new Page(this.pages)

  this.pages.add(page)

  return page
}

PDF.prototype.write = function(line) {
  if (Array.isArray(line)) {
    line.forEach(function(l) {
      this.write(l)
    }, this)
  } else {
    this.currentPage.contents.writeLine(line)
  }
}

var CursorFactory = require('./cursor')

PDF.prototype._compute = function() {
  var innerWidth = this.doc.style.width - this.doc.style.paddingLeft - this.doc.style.paddingRight

  var cursorFactory = new CursorFactory(this.doc.style)
  var cursor = cursorFactory.create(innerWidth)

  var threshold = 50

  while (!this.doc.compute(cursor)) {
    console.log('IT')
    cursor.reset()

    if (--threshold === 0) {
      throw new Error('Endless rendering?')
      break
    }
  }
}

PDF.prototype._build = function(ast, parent) {
  if (hasFunction(ast, 'begin')) {
    this.write(ast.begin(this, parent))
  }

  if (hasFunction(ast, 'render')) {
    this.write(ast.render(this, parent))
  }

  if (hasChildren(ast)) {
    ast.children.forEach(function(child) {
      this._build(child, { parent: parent, node: ast })
    }, this)
  }

  if (hasFunction(ast, 'end')) {
    this.write(ast.end(this, parent))
  }
}

var PDFDictionary = require('./object/dictionary')
var PDFArray      = require('./object/array')
var PDFString     = require('./object/string')
var uuid          = require('node-uuid')

PDF.prototype.build = function() {
  this.objects = []

  // list of all fonts in this document
  this.fonts   = new WeakMap
  this.subsets = []

  // list of all images in this document
  this.images  = []

  // the catalog and pages tree
  this.pages = new Pages(this.doc.style.width, this.doc.style.height)
  this.createPage()

  this.catalog = this.createObject('Catalog')
  this.catalog.prop('Pages', this.pages.toReference())

  this._compute()
  this._build(this.doc, null)

  this.pages.embed(this)

  // this.pagebreak()
  // this.render(this.cursor)
  this.subsets.forEach(function(subset) {
    subset.embed(this)
  }, this)
  // this.images.forEach(function(image) {
  //   image.embed(self)
  // })

  this.objects.forEach(function(obj, i) {
    obj.id = i + 1
  })

  var buf = '', xref = [], startxref

  // header
  buf += '%PDF-' + this.version.toString() + '\n'

  // The PDF format mandates that we add at least 4 commented binary characters
  // (ASCII value >= 128), so that generic tools have a chance to detect
  // that it's a binary file
  buf += '%\xFF\xFF\xFF\xFF\n'

  buf += '\n'

  // body
  this.objects.forEach(function(object) {
    xref.push(buf.length)
    buf += object.toString() + '\n\n'
  })

  // to support random access to individual objects, a PDF file
  // contains a cross-reference table that can be used to locate
  // and directly access pages and other important objects within the file
  startxref = buf.length
  buf += 'xref\n'
  buf += '0 ' + (this.objects.length + 1) + '\n'
  buf += '0000000000 65535 f \n'
  xref.forEach(function(ref) {
    buf += '0000000000'.substr(ref.toString().length) + ref + ' 00000 n \n'
  })

  // trailer
  var id = (new PDFString(uuid.v4())).toHexString()
  var version = require('../../../package.json').version
  var trailer = new PDFDictionary({
      Size: (this.objects.length + 1),
      Root: this.catalog.toReference(),
      ID:   new PDFArray([id, id]),
      Info: new PDFDictionary({
        Producer: new PDFString('pdfjs v' + version + ' (github.com/rkusa/pdfjs)'),
        CreationDate: new PDFString(utils.formatDate(new Date))
      })
  })
  buf += 'trailer\n'
  buf += trailer.toString() + '\n'
  buf += 'startxref\n'
  buf += startxref + '\n'
  buf += '%%EOF'

  return buf
}

PDF.prototype.toString = function() {
  return this.build()
}

var base64 = require('base-64')
PDF.prototype.toDataURL = function() {
  return 'data:application/pdf;base64,' + base64.encode(this.build())
}


function hasFunction(obj, name) {
  return typeof obj[name] === 'function'
}

function hasChildren(obj) {
  return obj.children && Array.isArray(obj.children)
}