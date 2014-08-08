'use strict'

var PDFObject  = require('./objects/object')
var PDFXObject = require('./objects/xobject')
var Pages      = require('./pages')
var Font       = require('./font')
var Image      = require('./image')
var utils      = require('./utils')

var Document = module.exports = function Document(font, opts) {
  this.version = 1.3

  // list of all objects in this document
  this.objects  = []

  // list of all fonts in this document
  this.fonts       = []
  this.subsets     = []
  this.defaultFont = this.registerFont(font)

  this.images   = []

  // call parents constructor
  if (!opts) opts = {}
  if (!opts.padding) opts.padding = { top: 20, right: 40, bottom: 20, left: 40 }
  Document.super_.call(this, this, opts)
  this.height = this.opts.height || 792

  // the catalog and pages tree
  this.catalog = this.createObject('Catalog')
  this.pages   = new Pages(this)
  this.catalog.prop('Pages', this.pages.toReference())

  this.areas = { header: null, footer: null }
}

var Fragment = require('./fragment')
utils.inherits(Document, Fragment)

Document.Font = Font

var areas = ['header', 'footer']
areas.forEach(function(area) {
  Document.prototype[area] = function(opts, definition) {
    if (typeof opts !== 'object') {
      definition = opts
      opts = {}
    }
    if (!opts.padding) opts.padding = { top: 0, right: this.padding.right, bottom: 0, left: this.padding.left }
    this.areas[area] = new Fragment(this, opts)
    if (typeof definition === 'function') {
      definition.call(this.areas[area], this.areas[area])
    } else {
      this.areas[area].text(definition, opts)
    }
    return this
  }
})

Document.prototype.registerFont = function(font) {
  var index
  if ((index = this.fonts.indexOf(font)) > -1) return this.subsets[index]
  var id = this.fonts.push(font)
  this.subsets.push(font.subset(this, id))
  return this.subsets[id - 1]
}

Document.prototype.addObject = function(object) {
  this.objects.push(object)
}

Document.prototype.createObject = function(type) {
  var object = new PDFObject()
  if (type) object.addProperty('Type', type)
  this.addObject(object)
  return object
}

Document.prototype.createXObject = function(subtype) {
  var xobject = new PDFXObject()
  if (subtype) xobject.addProperty('Subtype', subtype)
  this.addObject(xobject)
  return xobject
}

Document.prototype.createImage = function(data) {
  var image = new Image('Im' + (this.images.length + 1), data)
  this.images.push(image)
  this.addObject(image.xobject)
  return image
}

// Transaction
Document.prototype.startTransaction = function() {
  return new Transaction(this)
}

// Rendering

Document.prototype.pagebreak = function() {
  var page = this.cursor = this.pages.addPage()
  if (this.areas.header) {
    this.areas.header.height = 0
    this.areas.header.render(page, this.idth)
    this.areas.header.height = this.height - page.cursor.y - this.opts.padding.top
  }
  if (this.areas.footer) {
    var footer = this.areas.footer
    var transaction = this.startTransaction()
    var y = page.cursor.y
    footer.height = 0
    footer.render(page, this.width)
    var height = y - page.cursor.y
    transaction.rollback()
    page.cursor.y = this.padding.bottom + height
    footer.render(page, this.width)
    page.cursor.y = y
    footer.height = height
  }
  return page
}

var base64 = require('base-64')
Document.prototype.toDataURL = function() {
  return 'data:application/pdf;base64,' + base64.encode(this.toString())
}

var PDFDictionary = require('./objects/dictionary')
var PDFArray      = require('./objects/array')
var PDFString     = require('./objects/string')
var uuid          = require('node-uuid')

Document.prototype.toString = function() {
  var self = this
  this.objects = [this.catalog, this.pages.tree]

  this.pagebreak()
  this.render(this.cursor)
  this.subsets.forEach(function(subset) {
    subset.embed(self)
  })
  this.images.forEach(function(image) {
    image.embed(self)
  })

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
  var version = require('../package.json').version
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

// Transaction

var Transaction = function(doc) {
  this.doc = doc
  this.page = doc.pages.count - 1
  this.length = doc.cursor.contents.content.length
  this.y = doc.cursor.cursor.y
}

Transaction.prototype.rollback = function() {
  if (this.page < (this.doc.pages.count - 1)) {
    for (var i = this.doc.pages.count - 1; i > this.page; --i)
      this.doc.pages.removePageAt(i)
    this.doc.cursor = this.doc.pages.pages[this.page]
  }

  if (this.length < this.doc.cursor.contents.content.length) {
    this.doc.cursor.contents.slice(0, this.length)
  }

  this.doc.cursor.cursor.y = this.y
}

Transaction.prototype.commit = function() {
}


