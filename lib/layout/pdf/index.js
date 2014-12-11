'use strict'

var PDFObject  = require('./objects/object')
var PDFXObject = require('./objects/xobject')
var Pages      = require('./pages')
// var Font       = require('./font')
// var Image      = require('./image')
var utils      = require('./utils')

var PDF = module.exports = function PDF() {
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

var TTFFont = require('./font/ttf')

PDF.prototype._build = function(ast, pages, parent) {
  if ((ast.y - ast.height) < pages.current.bottom && !ast.allowBreak) {
    // console.log('break', ast.y, pages.current.bottom, ast.children[0].word.word)

    var p = parent
    while (p.parent) {
      if (hasFunction(p.node, 'end')) {
        pages.write(p.node.end(this, pages, p.parent))
      }

      p = p.parent
    }

    this.pages.createPage()

    p = parent
    while (p.parent) {
      if (hasFunction(p.node, 'begin')) {
        pages.write(p.node.begin(this, pages, p.parent))
      }

      p = p.parent
    }
  }

  ast.y += pages.current.offset

  if (hasFunction(ast, 'begin')) {
    pages.write(ast.begin(this, pages, parent))
  }

  if (hasFunction(ast, 'build')) {
    pages.write(ast.build(this, pages, parent))
  }

  if (hasChildren(ast)) {
    ast.children.forEach(function(child) {
      this._build(child, pages, { parent: parent, node: ast })
    }, this)
  }

  if (hasFunction(ast, 'end')) {
    pages.write(ast.end(this, pages, parent))
  }
}

var PDFDictionary = require('./objects/dictionary')
var PDFArray      = require('./objects/array')
var PDFString     = require('./objects/string')
var uuid          = require('node-uuid')

PDF.prototype.render = function(ast) {
  this.objects = []

  // list of all fonts in this document
  this.fonts   = new WeakMap
  this.subsets = []

  // list of all images in this document
  this.images  = []

  // the catalog and pages tree
  this.pages = new Pages(ast.document)
  this.pages.createPage()

  this.catalog = this.createObject('Catalog')
  this.catalog.prop('Pages', this.pages.toReference())

  this._build(ast, this.pages, null)

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

var base64 = require('base-64')
PDF.prototype.toDataURL = function() {
  return 'data:application/pdf;base64,' + base64.encode(this.render())
}

function hasFunction(obj, name) {
  return typeof obj[name] === 'function'
}

function hasChildren(obj) {
  return obj.children && Array.isArray(obj.children)
}