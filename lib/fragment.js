var Fragment = module.exports = function(doc, opts) {
  this.opts = opts || {}
  
  this.doc = doc
  
  this.width   = this.opts.width || 612
  if (!this.opts.padding) this.opts.padding = { top: 20, right: 40, bottom: 20, left: 40 }
  this.padding = new Padding(this)
  
  this.defaultFont = this.doc.defaultFont
  
  this.areas = {}
  this.contents = []
}

var Padding = function(doc) {
  this.doc = doc
}

Object.defineProperties(Padding.prototype, {
  left:   { enumerable: true, get: function() { return this.doc.opts.padding.left  }},
  right:  { enumerable: true, get: function() { return this.doc.opts.padding.right }},
  top:    { enumerable: true, get: function() {
    return this.doc.opts.padding.top + (this.doc.areas.header ? this.doc.areas.header.height || 0 : 0)
  }},
  bottom: { enumerable: true, get: function() {
    return this.doc.opts.padding.bottom + (this.doc.areas.footer ? this.doc.areas.footer.height || 0 : 0)
  }}
})

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
  },
  maxWidth: {
    enumerable: true,
    get: function() {
      return this.opts.width || Math.max.apply(Math, this.contents.map(function(content) {
        return content.maxWidth
      }))
    }
  },
  minHeight: {
    enumerable: true,
    get: function() {
      return Math.max.apply(Math, this.contents.map(function(content) {
        return content.minHeight
      }))
    }
  }
})

Fragment.prototype.pagebreak = function() {
  return this.doc.pagebreak()
}

Fragment.prototype.render = function(page, width) {
  if ('top' in this.opts && ((this.doc.height - this.opts.top) < this.doc.cursor.cursor.y || this.opts.position === 'force')) {
    this.doc.cursor.cursor.y = this.doc.height - this.opts.top
  }
  var self = this, cursor = this.doc.cursor, y = cursor.cursor.y
  this.contents.forEach(function(content) {
    content.render(self.doc.cursor, width || self.innerWidth)
  })
  if ('minHeight' in this.opts && this.doc.cursor === cursor && (y - this.opts.minHeight) < cursor.cursor.y) {
    cursor.cursor.y = y - this.opts.minHeight
  }
}

Fragment.prototype.registerFont = function(font) {
  return this.doc.registerFont(font)
}

Fragment.prototype.createObject = function(type) {
  return this.doc.createObject(type)
}

// Text objects

Fragment.prototype.text  = require('./content/text')
Fragment.prototype.table = require('./content/table')
Fragment.prototype.op    = require('./content/operation')

Fragment.prototype.fragment = function(opts, definition) {
  if (typeof opts === 'function') {
    definition = opts
    opts = {}
  }
  
  var fragment = new Fragment(this.doc, opts)
  definition.call(fragment, fragment)
  this.contents.push(fragment)
  
  return this
}