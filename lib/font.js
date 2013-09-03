var TTFFont = require('./fonts/ttf')
  , PDFName = require('./objects/name')
  , fs = require('fs')

var TYPES = ['regular', 'italic', 'bold', 'boldItalic', 'light', 'lightItalic']

var Font = module.exports = function(opts) {
  if (typeof opts === 'string') opts = { regular: opts }
  var self = this
  this.subsets = {}
  TYPES.forEach(function(type) {
    if (type in opts) {
      self[type] = new TTFFont(fs.readFileSync(opts[type]))
      self.subsets[type] = self[type].subset()
    }
  })
}

Font.prototype.subset = function(id) {
  return new Subset(this, id)
}

var Subset = function(font, id) {
  var self = this, i = 1
  TYPES.forEach(function(type) {
    if (!(type in font)) return
    self[type] = font[type].subset()
    self[type].id = new PDFName('F' + id + '-' + i++)
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
  var subtype
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