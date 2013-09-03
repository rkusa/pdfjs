var PDFStream     = require('./objects/stream')
  , PDFDictionary = require('./objects/dictionary')
  , PDFArray      = require('./objects/array')
  , PDFName       = require('./objects/name')
  , Text          = require('./helper/text')
  , Table         = require('./helper/table')
  , Area          = require('./helper/area')

var Page = module.exports = function(document, parent) {
  this.document   = document
  this.object     = this.document.createObject('Page')
  this.contents   = new PDFStream(document.createObject())
  this.fonts      = new PDFDictionary({})
  this.pageNumber = 1
  this.cursor     = document.height - document.padding.top
  this.area       = { header: null, footer: null }
  this.padding    = { top: document.padding.top, right: document.padding.right,
                    bottom: document.padding.bottom, left: document.padding.left }

                    
  this.object.addProperty('Parent', parent.toReference())
  this.object.addProperty('Contents', this.contents.toReference())
  this.object.addProperty('Resources', new PDFDictionary({
    ProcSet: new PDFArray([new PDFName('PDF'), new PDFName('Text'), new PDFName('ImageB'), new PDFName('ImageC'), new PDFName('ImageI')]),
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
  return this
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

Page.prototype.setFillRGBColor = function(r, g, b) {
  this.contents.writeLine(r + ' ' + g + ' ' + b + ' rg')
  return this
}

Page.prototype.setTextMatrix = function(a, b, c, d, e, f) {
  this.contents.writeLine(a + ' ' + b + ' ' + c + ' ' + d + ' ' + e + ' ' + f + ' Tm')
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
    , x = args.shift() || this.padding.left
  if (typeof options !== 'object') options = {}

  var text   = new Text(this, x, text, options)
    , cursor = text.print(y)
  
  if (text.page === this) {
    this.cursor = cursor
  } else {
    this.cursor = this.padding.bottom
    text.page.cursor = cursor
  }
  
  return text.page
}

Page.prototype.table = function(x, y, options, definition) {
  var args = Array.prototype.slice.call(arguments)
    , definition = args.pop()
    , options = args.pop()
    , y = typeof options === 'number' ? options : (args.pop() || this.cursor)
    , x = args.shift() || this.padding.left
    
  if (typeof options !== 'object') options = {}
  
  var table = new Table(this, x, options, definition)
  table.print(y)
  
  if (table.page === this) {
    this.cursor = table.y
  } else {
    this.cursor = this.padding.bottom
    table.page.cursor = table.y
  }
  
  return table.page
}

Page.prototype.break = function() {
  var newPage = this.document.addPage()
  newPage.pageNumber = this.pageNumber + 1
  if (this.area.header) newPage.header(this.area.header.definition)
  if (this.area.footer) newPage.footer(this.area.footer.definition)
  return newPage
}

Page.prototype.header = function(definition) {
  var area = new Area(this, definition)
  this.area.header = {
    definition: definition,
    area: area
  }
  this.padding.top += area.height
  area.draw(this.cursor)
  this.cursor -= area.height
}

Page.prototype.footer = function(definition) {
  var area = new Area(this, definition)
  this.area.footer = {
    definition: definition,
    area: area
  }
  area.draw(this.padding.bottom + area.height)
  this.padding.bottom += area.height
}

Page.prototype.toReference = function() {
  return this.object.toReference()
}