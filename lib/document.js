'use strict'

var PDFObject = require('./objects/object')
var Pages     = require('./pages')
var Font      = require('./font')
var utils     = require('./utils')

var Document = module.exports = function Document(font, opts) {
  this.version = 1.3

  // list of all objects in this document
  this.objects   = []

  // list of all fonts in this document
  this.fonts       = []
  this.subsets     = []
  this.defaultFont = this.registerFont(font)

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

Document.prototype.createObject = function(type) {
  var object = new PDFObject()
  if (type) object.addProperty('Type', type)
  this.objects.push(object)
  return object
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

Document.prototype.toDataURL = function() {
  return 'data:application/pdfbase64,' + Base64.encode(this.toString())
}

var PDFDictionary = require('./objects/dictionary')
var PDFArray      = require('./objects/array')
var PDFString     = require('./objects/string')

Document.prototype.toString = function() {
  var self = this
  this.objects = [this.catalog, this.pages.tree]

  this.pagebreak()
  this.render(this.cursor)
  this.subsets.forEach(function(subset) {
    subset.embed(self)
  })

  var buf = '', xref = [], startxref

  // header
  buf += '%PDF-' + this.version.toString() + '\n'

  // The PDF format mandates that we add at least 4 commented binary characters
  // (ASCII value >= 128), so that generic tools have a chance to detect
  // that it's a binary file
  buf += '%\xFF\xFF\xFF\xFF\n'

  buf += '\n'

  this.objects.forEach(function(obj, i) {
    obj.id = i + 1
  })

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
  var id = (new PDFString(uuid4())).toHexString()
  var version = require('../package.json').version
  var trailer = new PDFDictionary({
      Size: (this.objects.length + 1),
      Root: this.catalog.toReference(),
      ID:   new PDFArray([id, id]),
      Info: new PDFDictionary({
        Producer: new PDFString('pdfjs v' + version + ' (github.com/rkusa/pdfjs)'),
        CreationDate: new PDFString(formatDate(new Date))
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

/**
*
*  Base64 encode / decode
*  http://www.webtoolkit.info/
*
**/
var Base64 = {
  // private property
  _keyStr : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',

  // public method for encoding
  encode : function (input) {
    var output = ''
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4
    var i = 0

    input = Base64._utf8Encode(input)

    while (i < input.length) {
      chr1 = input.charCodeAt(i++)
      chr2 = input.charCodeAt(i++)
      chr3 = input.charCodeAt(i++)

      enc1 = chr1 >> 2
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4)
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6)
      enc4 = chr3 & 63

      if (isNaN(chr2)) {
          enc3 = enc4 = 64
      } else if (isNaN(chr3)) {
          enc4 = 64
      }

      output = output +
      this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
      this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4)
    }

    return output
  },

  // private method for UTF-8 encoding
  _utf8Encode : function (string) {
    string = string.replace(/\r\n/g,'\n')
    var utftext = ''

    for (var n = 0; n < string.length; n++) {
      var c = string.charCodeAt(n)

      // workaround to not encode UTF8 characters
      // TODO: improve ...
      utftext += String.fromCharCode(Math.min(c, 0xff))

      // if (c < 128) {
      //   utftext += String.fromCharCode(c)
      // }
      // else if((c > 127) && (c < 2048)) {
      //   utftext += String.fromCharCode((c >> 6) | 192)
      //   utftext += String.fromCharCode((c & 63) | 128)
      // }
      // else {
      //   utftext += String.fromCharCode((c >> 12) | 224)
      //   utftext += String.fromCharCode(((c >> 6) & 63) | 128)
      //   utftext += String.fromCharCode((c & 63) | 128)
      // }
    }

    return utftext
  }
}

// UUID v4
// source: https://gist.github.com/jed/982883
function uuid4(
  a                  // placeholder
){
  return a           // if the placeholder was passed, return
    ? (              // a random number from 0 to 15
      a ^            // unless b is 8,
      Math.random()  // in which case
      * 16           // a random number from
      >> a / 4       // 8 to 11
      ).toString(16) // in hexadecimal
    : (              // or otherwise a concatenated string:
      [1e7] +        // 10000000 +
      -1e3 +         // -1000 +
      -4e3 +         // -4000 +
      -8e3 +         // -80000000 +
      -1e11          // -100000000000,
      ).replace(     // replacing
        /[018]/g,    // zeroes, ones, and eights with
        uuid4        // random hex digits
      )
}

function formatDate(date) {
  var str = 'D:'
          + date.getFullYear()
          + ('00' + (date.getMonth() + 1)).slice(-2)
          + ('00' + date.getDate()).slice(-2)
          + ('00' + date.getHours()).slice(-2)
          + ('00' + date.getMinutes()).slice(-2)
          + ('00' + date.getSeconds()).slice(-2)

  var offset = date.getTimezoneOffset()
  var rel = offset === 0 ? 'Z' : (offset > 0 ? '-' : '+')
  offset = Math.abs(offset)
  var hoursOffset = Math.floor(offset / 60)
  var minutesOffset = offset - hoursOffset * 60

  str += rel
      + ('00' + hoursOffset).slice(-2)   + '\''
      + ('00' + minutesOffset).slice(-2) + '\''

  return str
}
