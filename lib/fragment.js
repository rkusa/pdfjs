var Fragment = module.exports = function(doc, opts) {
  this.opts = opts || {}
  
  this.doc = doc
  
  this.width   = this.opts.width || 612
  if (!this.opts.padding) this.opts.padding = { top: 0, right: 0, bottom: 0, left: 0 }
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
  var page = this.doc.pagebreak()
  this.doc.cursor.cursor.x += this.padding.left
  return page
}

Fragment.prototype.render = function(page, width) {
  var x = page.cursor.x
  page.cursor.x += this.padding.left
  if (width) width = width - this.padding.right - this.padding.left
  
  if ('top' in this.opts && ((this.doc.height - this.opts.top) < page.cursor.y || this.opts.position === 'force')) {
    page.cursor.y = this.doc.height - this.opts.top
  }
  var self = this, y = page.cursor.y
  this.contents.forEach(function(content) {
    content.render(self.doc.cursor, width || self.innerWidth)
  })
  if ('minHeight' in this.opts && this.doc.cursor === page && (y - this.opts.minHeight) < page.cursor.y) {
    page.cursor.y = y - this.opts.minHeight
  }
  
  page.cursor.x = x
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