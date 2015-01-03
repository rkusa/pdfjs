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

  this.offset = 0
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
    var delta = (y + height) - top
    height -= delta
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
      path[i] += + this.offset
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
    console.log('SKIP', x1, y1, x2, y2)
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

PDF.prototype.write = function(line) {
  var line = Array.prototype.slice.call(arguments).map(function(arg) {
    return typeof arg === 'number' ? arg.toFixed(this.doc.style.precision) : arg
  }, this).join(' ')
  this.currentPage.contents.writeLine(line)
}

var CursorFactory = require('./cursor')

PDF.prototype._compute = function() {
  var innerWidth = this.doc.style.width - this.doc.style.paddingLeft - this.doc.style.paddingRight

  var cursorFactory = new CursorFactory(this.doc.style)
  var cursor = cursorFactory.create(innerWidth)

  this.doc.compute(cursor)
  cursor.reset()

  var threshold = 50

  while (!this.doc.arrange(cursor)) {
    console.log('IT', threshold)
    cursor.reset()
    this.doc.compute(cursor)
    cursor.reset()

    if (--threshold === 0) {
      throw new Error('Endless rendering?')
      break
    }
  }
}

PDF.prototype._build = function(ast, parent) {
  if (hasFunction(ast, 'begin')) {
    ast.begin(this, parent)
  }

  if (hasFunction(ast, 'render')) {
    ast.render(this, parent)
  }

  if (hasChildren(ast)) {
    ast.children.forEach(function(child) {
      this._build(child, { parent: parent, node: ast })
    }, this)
  }

  if (hasFunction(ast, 'end')) {
    ast.end(this, parent)
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

function intersect(p0_x, p0_y, p1_x, p1_y, p2_x, p2_y, p3_x, p3_y) {
  var s1_x = p1_x - p0_x
  var s1_y = p1_y - p0_y
  var s2_x = p3_x - p2_x
  var s2_y = p3_y - p2_y

  var s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y)
  var t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y)

  if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
    // Collision detected
    var intX = p0_x + (t * s1_x);
    var intY = p0_y + (t * s1_y);
    return [intX, intY]
  }

  return null // No collision
}