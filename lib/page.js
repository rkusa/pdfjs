var PDFStream     = require('./datatypes/stream')
  , PDFDictionary = require('./datatypes/dictionary')
  , Text          = require('./text')
  , Table         = require('./helper/table')

var Page = module.exports = function(document, parent) {
  this.document = document
  this.object   = this.document.createObject('Page')
  this.contents = new PDFStream(document.createObject())
  this.fonts    = new PDFDictionary({})
  this.cursor   = document.height - document.padding[0]
  
  this.object.addProperty('Parent', parent.toReference())
  this.object.addProperty('Contents', this.contents.toReference())
  
  this.object.addProperty('Resources', new PDFDictionary({
    Font: this.fonts
  }))
}

Page.prototype.text = function(/*text, x, y, options*/) {
  var args = Array.prototype.slice.call(arguments)
    , text = args.shift()
    , options = args.pop()
    , y = typeof options === 'number' ? options : (args.pop() || this.cursor)
    , x = args.shift() || this.document.padding[3]
    
  if (typeof options !== 'object') options = {}
  
  var text   = new Text(this, text, options)
    , cursor = text.print(x, y)
  
  if (text.page === this) {
    this.cursor = cursor
  } else {
    this.cursor = this.document.padding[2]
    text.page.cursor = cursor
  }
  
  return text.page
}

Page.prototype.table = function(x, y, options, definition) {
  var args = Array.prototype.slice.call(arguments)
    , definition = args.pop()
    , options = args.pop()
    , y = typeof options === 'number' ? options : (args.pop() || this.cursor)
    , x = args.shift() || this.document.padding[3]
    
  if (typeof options !== 'object') options = {}
  
  var table = new Table(this, x, y, options, definition)
  
  if (table.page === this) {
    this.cursor = table.y
  } else {
    this.cursor = this.document.padding[2]
    table.page.cursor = table.y
  }
  
  return table.page
}

Page.prototype.addFont = function(font) {
  this.fonts.add(font.id, font.toReference())
}

Page.prototype.toReference = function() {
  return this.object.toReference()
}