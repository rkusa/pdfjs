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

PDF.prototype.prepare = function(ast, page, state) {
  if (Array.isArray(ast)) {
    ast.forEach(function(child) {
      page = this.prepare(child, page, state)
    }, this)
    return page
  }

  if (page) {
    if (ast.y - ast.height < page.bottom) {
      console.log('break', ast.type, ast.height)
      var next = ast.breakAt(page.bottom)
      this.prepare(ast, page, state)
      page = this.pages.createPage()
      state = {}
      this.prepare(next, page, state)
      return
    }

    ast.y += page.offset
  }





  // if (page) {
  //   if (ast.y < page.bottom) {
  //     console.log('break', ast.y, page.bottom)
  //     page = this.pages.createPage()
  //     state = {}
  //     console.log('break2', page.offset, page.bottom)
  //   }

  //   ast.y += page.offset
  // }

  // console.log(ast.type, ast.y)

  switch (ast.type) {
    case 'TextNode':
      page.contents.writeLine('BT')
      state = { color: null, font: null, fontSize: null, text: true }
      this.prepare(ast.children, page, state)
      page.contents.writeLine('ET')
      break
    case 'LineNode':
      // position the text in user space
      page.contents.writeLine('1 0 0 1 ' + ast.x + ' ' + ast.y + ' Tm')
      state.left = ast.x
      this.prepare(ast.children, page, state)
      break
    case 'WordNode':
      var font = this.fonts.get(ast.word.style.font)
      if (!font) {
        font = new TTFFont(this.subsets.length + 1, ast.word.style.font)
        this.fonts.set(ast.word.style.font, font)
        this.subsets.push(font)
      }

      if (!page.fonts.has(font.alias)) {
        page.fonts.add(font.alias, font.toReference())
      }

      page.contents.writeLine((ast.x - state.left) + ' 0 Td')
      state.left = ast.x

      var fontSize = ast.word.style.fontSize
      if (state.font !== font || state.fontSize !== fontSize) {
        page.contents.writeLine([font.alias, fontSize, 'Tf'].join(' '))
        state.font = font
        state.fontSize = fontSize
      }

      var color = ast.word.style.color

      if (state.color !== color) {
        page.contents.writeLine(utils.colorToRgb(color).join(' ') + ' rg')
        state.color = color
      }

      var str = font.encode(ast.word.toString())
      page.contents.writeLine((new PDFString(str)).toHexString() + ' Tj')

      break
    case 'DocumentNode':
      this.objects = []

      // list of all fonts in this document
      this.fonts   = new WeakMap
      this.subsets = []

      // list of all images in this document
      this.images  = []

      // the catalog and pages tree
      this.pages = new Pages(ast.document)

      this.catalog = this.createObject('Catalog')
      this.catalog.prop('Pages', this.pages.toReference())

      page = this.pages.createPage()

      this.prepare(ast.children, page)
      break
  }

  return page
}

var PDFDictionary = require('./objects/dictionary')
var PDFArray      = require('./objects/array')
var PDFString     = require('./objects/string')
var uuid          = require('node-uuid')

PDF.prototype.render = function() {
  this.objects = [this.catalog]
  console.log('ASD')
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
