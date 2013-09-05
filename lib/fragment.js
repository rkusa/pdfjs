var Fragment = module.exports = function(doc, opts) {
  if (!opts) opts = {}
  
  this.doc = doc
  
  this.width   = opts.width   || 612
  this.height  = opts.height  || 792
  this.padding = opts.padding || { top: 20, right: 40, bottom: 20, left: 40 }
  
  this.defaultFont = this.doc.defaultFont
  
  this.contents = []
}

// <------- width ---------->
// __________________________     
// | ______________________ |     ^
// | |                 ^  | |     |
// | |<-- innerWidth --|->| |     |
// | |                 |  | |     |
// | |                 |  | |     |
// | |                 |  | |     |
// | |                 |  | |     | height
// | |                 |  | |     |
// | |        innerHeight | |     |
// | |                 |  | |     |
// | |                 |  | |     |
// | |                 |  | |     |
// | |_________________v__| |     |
// |________________________|     v

Object.defineProperties(Fragment.prototype, {
  innerWidth: {
    enumerable: true,
    get: function() {
      return this.width - this.padding.right - this.padding.left
    }
  },
  innerHeight: {
    enumerable: true,
    get: function() {
      return this.height - this.padding.top - this.padding.bottom
    }
  }
})

Fragment.prototype.registerFont = function(font) {
  return this.doc.registerFont(font)
}

Fragment.prototype.createObject = function(type) {
  return this.doc.createObject(type)
}

var PDFString = require('./objects/string')
  , Operation = require('./content/operation')

// Text objects

Fragment.prototype.text  = require('./content/text')
Fragment.prototype.table = require('./content/table')