'use strict'

var PDFObject  = require('./object/object')
var PDFXObject = require('./object/xobject')
var Pages      = require('./object/pages')
var Page       = require('./object/page')
var uuid       = require('node-uuid')
var debug      = require('debug')('pdfjs')

var version = require('../../package.json').version

var PDF = module.exports = function PDF(doc) {
  this.doc = doc

  this.version = 1.3

  this.info = {
    id:           uuid.v4(),
    producer:     'pdfjs v' + version + ' (github.com/rkusa/pdfjs)',
    creationDate: null
  }

  this.offset = 0
}

PDF.prototype.addObject = function(object) {
  this.objects.push(object)
}

PDF.prototype.createObject = function(type) {
  var object = new PDFObject()
  if (type) object.addProperty('Type', type)
  this.addObject(object)
  return object
}

PDF.prototype.createXObject = function(subtype) {
  var xobject = new PDFXObject()
  if (subtype) xobject.addProperty('Subtype', subtype)
  this.addObject(xobject)
  return xobject
}

// PDF.prototype.createImage = function(data) {
//   var image = new Image('Im' + (this.images.length + 1), data)
//   this.images.push(image)
//   this.addObject(image.xobject)
//   return image
// }

PDF.prototype.createPage = function() {
  var pages = this.pages.pages
  var index = pages.indexOf(this.currentPage)

  if (index + 1 < pages.length) {
    return this.currentPage = pages[index + 1]
  } else {
    var page = this.currentPage = new Page(this.pages)

    this.pages.add(page)

    return page
  }
}

PDF.prototype.Tm = function(a, b, c, d, e, f) {
  this.write(a, b, c, d, e, f + this.offset, 'Tm')
}

PDF.prototype.Tj = function(str) {
  this.write(str, 'Tj')
}

PDF.prototype.Td = function(x, y) {
  this.write(x, y, 'Td')
}

PDF.prototype.Tf = function(font, size) {
  this.write(font, size, 'Tf')
}

PDF.prototype.rg = function(r, g, b) {
  this.write(r, g, b, 'rg')
}

PDF.prototype.RG = function(r, g, b) {
  this.write(r, g, b, 'RG')
}

PDF.prototype.BT = function() {
  this.write('BT')
}

PDF.prototype.ET = function() {
  this.write('ET')
}

PDF.prototype.re = function(x, y, width, height) {
  this.write(x, y + this.offset, width, height, 're')
}

PDF.prototype.rectangle = function(x, y, width, height) {
  y += this.offset

  var top = this.doc.style.height - this.doc.style.paddingTop

  if (y < this.doc.style.paddingBottom) {
    var delta = this.doc.style.paddingBottom - y
    y = this.doc.style.paddingBottom
    height -= delta
  } else if (y + height > top) {
    height -= (y + height) - top
  }

  if (height > this.doc.style.innerHeight) {
    height = this.doc.style.innerHeight
  }

  this.re(x, y - this.offset, width, height, 're')
}

PDF.prototype.f = function() {
  this.write('f')
}

PDF.prototype.w = function(lineWidth) {
  this.write(lineWidth, 'w')
}

PDF.prototype.S = function() {
  var path = Array.prototype.slice.call(arguments)
  for (var i = 0, len = path.length; i < len; ++i) {
    // every second (1, because we start at 0)
    if (i % 3 === 1) {
      path[i] += this.offset
    }
  }

  this.write.apply(this, path.concat('S'))
}

PDF.prototype.line = function(x1, y1, x2, y2) {
  y1 += this.offset
  y2 += this.offset

  var top = this.doc.style.height - this.doc.style.paddingTop
  var bottom = this.doc.style.paddingBottom
  var left = this.doc.style.paddingLeft
  var right = this.doc.style.width - this.doc.style.paddingRight

  if ((y1 > top && y2 > top) || (y1 < bottom && y2 < bottom) || (x1 < left && x2 < left) || (x1 > right && x2 > right)) {
    return
  }

  // top
  var topIntersection = intersect(x1, y1, x2, y2, left, top, right, top)
  if (topIntersection) {
    if (y1 > top) {
      x1 = topIntersection[0]
      y1 = topIntersection[1]
    } else if(y2 > top) {
      x2 = topIntersection[0]
      y2 = topIntersection[1]
    }
  }

  // // left
  var leftIntersection = intersect(x1, y1, x2, y2, left, top, left, bottom)
  if (leftIntersection) {
    if (x1 < left) {
      x1 = leftIntersection[0]
      y1 = leftIntersection[1]
    } else if (x2 < left) {
      x2 = leftIntersection[0]
      y2 = leftIntersection[1]
    }
  }

  // right
  var rightIntersection = intersect(x1, y1, x2, y2, right, top, right, bottom)
  if (rightIntersection) {
    if (x1 > right) {
      x1 = rightIntersection[0]
      y1 = rightIntersection[1]
    } else if (x2 > right) {
      x2 = rightIntersection[0]
      y2 = rightIntersection[1]
    }
  }

  // bottom
  var bottomIntersection = intersect(x1, y1, x2, y2, left, bottom, right, bottom)
  if (bottomIntersection) {
    if (y1 < bottom) {
      x1 = bottomIntersection[0]
      y1 = bottomIntersection[1]
    } else if (y2 < bottom) {
      x2 = bottomIntersection[0]
      y2 = bottomIntersection[1]
    }
  }

  this.S(x1, y1 - this.offset, 'm', x2, y2 - this.offset, 'l')
}

// save graphics state
PDF.prototype.q = function() {
  this.write('q')
}

PDF.prototype.cm = function(a, b, c, d, e, f) {
  this.write(a, b, c, d, e, f + this.offset, 'cm')
}

// paint image
PDF.prototype.Do = function(name) {
  this.write(name, 'Do')
}

// restore graphics state
PDF.prototype.Q = function() {
  this.write('Q')
}

function toFixed(num, precision) {
  if (isNaN(num)) {
    var stack = (new Error).stack.split('\n')
    stack.splice(0, 5)
    stack = stack.join('\n')
    console.warn("Writing NaN - there probably went something wrong.\nPlease report this issue to http://github.com/rkusa/pdfjs/issues\nStack Trace:\n" + stack)
  }
  return (+(Math.floor(+(num + 'e' + precision)) + 'e' + -precision)).toFixed(precision)
}

PDF.prototype.write = function() {
  var line = Array.prototype.slice.call(arguments).map(function(arg) {
    return typeof arg === 'number' ? toFixed(arg, this.doc.style.precision) : arg
  }, this).join(' ')
  this.currentPage.contents.writeLine(line)
}

var CursorFactory = require('./cursor')

PDF.prototype._compute = function() {
  var cursorFactory = new CursorFactory(this.doc)
  var cursor = cursorFactory.create()

  this.doc.compute(cursor)
  cursor.reset()

  var iteration = 0
  var threshold = this.doc.style.threshold

  while (!this.doc.arrange(cursor)) {
    debug('------- Computation Iteration %d -------', iteration)
    cursor.reset()
    this.doc.compute(cursor)
    cursor.reset()

    if (++iteration >= threshold) {
      throw new Error('Endless rendering?')
    }
  }
}

PDF.prototype._build = function(ast, parent) {
  if (!ast.visible) {
    return
  }

  if (hasFunction(ast, 'begin')) {
    ast.begin(this, parent)
  }

  if (hasFunction(ast, 'render')) {
    ast.render(this, parent)
  }

  if (hasChildren(ast)) {
    if (ast.direction === 'leftRight') {
      var rowPage = this.currentPage
      var rowOffset = this.offset
      var endOffset = this.offset
    }

    ast.children.forEach(function(child) {
      this._build(child, { parent: parent, node: ast })

      if (ast.direction === 'leftRight') {
        endOffset = Math.max(endOffset, this.offset)
        this.currentPage = rowPage
        this.offset = rowOffset
      }
    }, this)

    if (ast.direction === 'leftRight') {
      this.currentPage = this.pages.pages[this.pages.pages.length - 1]
      this.offset = endOffset
    }
  }

  if (hasFunction(ast, 'end')) {
    ast.end(this, parent)
  }
}

var PDFXref       = require('./object/xref')
var PDFTrailer    = require('./object/trailer')

PDF.prototype.build = function() {
  this.objects = []

  // node to object mapping
  this.mapping = Object.create(null)

  // list of all fonts in this document
  this.fonts   = []

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
  this.fonts.forEach(function(font) {
    font.embed(this)
  }, this)
  this.images.forEach(function(image) {
    image.embed(this)
  }, this)

  this.objects.forEach(function(obj, i) {
    obj.id = i + 1
  })

  var buf  = ''

  // header
  buf += '%PDF-' + this.version.toString() + '\n'

  // The PDF format mandates that we add at least 4 commented binary characters
  // (ASCII value >= 128), so that generic tools have a chance to detect
  // that it's a binary file
  buf += '%\xFF\xFF\xFF\xFF\n\n'

  // body
  var xref = new PDFXref
  this.objects.forEach(function(object) {
    xref.add(object.id, buf.length, object)
    buf += object.toString() + '\n\n'
  })

  // to support random access to individual objects, a PDF file
  // contains a cross-reference table that can be used to locate
  // and directly access pages and other important objects within the file
  var startxref = buf.length
  buf += xref.toString()

  // trailer
  var trailer = new PDFTrailer(this.objects.length + 1, this.catalog, this.info)
  buf += trailer.toString() + '\n'

  // startxref
  buf += 'startxref\n'
  buf += startxref + '\n'
  buf += '%%EOF'

  return buf
}

PDF.prototype.toString = function() {
  return this.build()
}

var base64 = require('base-64')
PDF.prototype.toBase64 = function() {
  return base64.encode(this.build())
}

PDF.prototype.toDataURL = function() {
  return 'data:application/pdf;base64,' + this.toBase64()
}


function hasFunction(obj, name) {
  return typeof obj[name] === 'function'
}

function hasChildren(obj) {
  return obj.children && Array.isArray(obj.children)
}

function intersect(p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y) {
  var s1x = p1x - p0x
  var s1y = p1y - p0y
  var s2x = p3x - p2x
  var s2y = p3y - p2y

  var s = (-s1y * (p0x - p2x) + s1x * (p0y - p2y)) / (-s2x * s1y + s1x * s2y)
  var t = ( s2x * (p0y - p2y) - s2y * (p0x - p2x)) / (-s2x * s1y + s1x * s2y)

  if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
    // Collision detected
    var intX = p0x + (t * s1x)
    var intY = p0y + (t * s1y)
    return [intX, intY]
  }

  return null // No collision
}
