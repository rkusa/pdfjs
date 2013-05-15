var PDFStream     = require('./datatypes/stream')
  , PDFDictionary = require('./datatypes/dictionary')
  , Text          = require('./helper/text')
  , Table         = require('./helper/table')

var Page = module.exports = function(document, parent) {
  this.document = document
  this.object   = this.document.createObject('Page')
  this.contents = new PDFStream(document.createObject())
  this.fonts    = new PDFDictionary({})
  this.cursor   = document.height - document.padding.top
  
  this.object.addProperty('Parent', parent.toReference())
  this.object.addProperty('Contents', this.contents.toReference())
  
  this.object.addProperty('Resources', new PDFDictionary({
    Font: this.fonts
  }))
}

Page.prototype.beginText = function() {
  this.contents.writeLine('BT')
  return this
}

Page.prototype.moveTextCursor = function(x, y) {
  this.contents.writeLine(x + ' ' + y + ' Td')
  return this
}

Page.prototype.setFont = function(font, size) {
  this.contents.writeLine('/' + font  + ' ' + size + ' Tf')
}

Page.prototype.showText = function(text) {
  text = ((function() {
    var results = []
    for (var i = 0, len = text.length; i < len; ++i) {
      results.push(text.charCodeAt(i).toString(16))
    }
    return results
  })()).join('')
  
  this.contents.writeLine('<' + text + '> Tj')
  
  return this
}

Page.prototype.setWordSpacing = function(wordSpacing) {
  this.contents.writeLine(wordSpacing + ' Tw')
  return this
}

Page.prototype.endText = function() {
  this.contents.writeLine('ET')
  return this
}

Page.prototype.setStrokeRGBColor = function(r, g, b) {
  this.contents.writeLine(r + ' ' + g + ' ' + b + ' RG')
  return this
}

Page.prototype.setLineWidth = function(width) {
  this.contents.writeLine(width + ' w')
  return this
}

Page.prototype.stroke = function(from, to) {
  this.contents.writeLine(from[0] + ' ' + from[1] + ' m ' + to[0] + ' ' + to[1] + ' l S')
  return this
}

Page.prototype.text = function(/*text, x, y, options*/) {
  var args = Array.prototype.slice.call(arguments)
    , text = args.shift()
    , options = args.pop()
    , y = typeof options === 'number' ? options : (args.pop() || this.cursor)
    , x = args.shift() || this.document.padding.left
    
  if (typeof options !== 'object') options = {}
  
  var text   = new Text(this, text, options)
    , cursor = text.print(x, y)
  
  if (text.page === this) {
    this.cursor = cursor
  } else {
    this.cursor = this.document.padding.bottom
    text.page.cursor = cursor
  }
  
  return text.page
}

Page.prototype.table = function(x, y, options, definition) {
  var args = Array.prototype.slice.call(arguments)
    , definition = args.pop()
    , options = args.pop()
    , y = typeof options === 'number' ? options : (args.pop() || this.cursor)
    , x = args.shift() || this.document.padding.left
    
  if (typeof options !== 'object') options = {}
  
  var table = new Table(this, x, y, options, definition)
  
  if (table.page === this) {
    this.cursor = table.y
  } else {
    this.cursor = this.document.padding.bottom
    table.page.cursor = table.y
  }
  
  return table.page
}

Page.prototype.addFont = function(font) {
  this.fonts.add(font.id, font.toReference())
}

Page.prototype.break = function() {
  var newPage = this.document.addPage()
  return newPage
}

Page.prototype.toReference = function() {
  return this.object.toReference()
}