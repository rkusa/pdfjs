'use strict'

var TTFFont = require('./fonts/ttf')
var PDFName = require('./objects/name')

var TYPES = ['regular', 'italic', 'bold', 'boldItalic', 'light', 'lightItalic']

var Font = module.exports = function(opts) {
  if (!('regular' in opts)) opts = { regular: opts }
  var self = this
  this.subsets = {}
  TYPES.forEach(function(type) {
    if (type in opts) {
      // GLOBAL[('Buffer').toString()] is used instead of Buffer to trick browserify
      // to not load a Buffer polyfill just for instance testing. The `toString()` part
      // is used to trick eslint to not throw
      var isArrayBuffer = opts[type] instanceof ArrayBuffer
      var isBuffer = typeof GLOBAL !== 'undefined' && opts[type] instanceof GLOBAL[('Buffer').toString()]
      if (!isArrayBuffer && !isBuffer) {
        throw new Error('Property `' + type + '` must be a Buffer or a Arraybuffer.')
      }
      self[type] = new TTFFont(opts[type])
      self.subsets[type] = self[type].subset()
    }
  })
}

Font.prototype.subset = function(doc, id) {
  return new Subset(doc, this, id)
}

var Subset = function(doc, font, id) {
  var self = this, i = 1
  TYPES.forEach(function(type) {
    if (!(type in font)) return
    self[type] = font[type].subset()
    self[type].id = new PDFName('F' + id + '-' + i++)
    self[type].object = doc.createObject('Font')
    self[type].use(' ')
  })
}

Subset.prototype.addTo = function(page) {
  var self = this
  TYPES.forEach(function(type) {
    if (!(type in self) || !self[type].isUsed) return
    page.fonts.add(self[type].id, self[type].toReference())
  })
}

Subset.prototype.fromOpts = function(opts) {
  var type = typeFromOpts(opts)
  if (!(type in this)) throw new Error('Font for `' + type + '` not provided.')
  return this[type]
}

Subset.prototype.embed = function(doc) {
  var self = this
  TYPES.forEach(function(type) {
    if (!(type in self) || !self[type].isUsed) return
    self[type].embed(doc)
  })
}

function typeFromOpts(opts) {
  if (opts.bold === true) {
    if (opts.italic === true) return 'boldItalic'
    else return 'bold'
  }
  else if (opts.light === true) {
    if (opts.italic === true) return 'lightItalic'
    else return 'light'
  }
  else if (opts.italic === true) {
    return 'italic'
  }
  else {
    return 'regular'
  }
}
