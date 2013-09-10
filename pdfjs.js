(function(e){if("function"==typeof bootstrap)bootstrap("pdfjs",e);else if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else if("undefined"!=typeof ses){if(!ses.ok())return;ses.makePdfjs=e}else"undefined"!=typeof window?window.Pdfjs=e():global.Pdfjs=e()})(function(){var define,ses,bootstrap,module,exports;
return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = function(op) {
  var operation = new Operation(op)
  this.contents.push(operation)

  return this
}

var Operation = function(op) {
  this.op = op
}

Operation.prototype.render = function(page, width) {
  page.contents.writeLine(this.op)
}
},{}],2:[function(require,module,exports){
module.exports = function(opts, definition) {
  this.contents.push(new Table(this, opts, definition))
  return this
}

var utils = require('../utils')
  
var defaults = {
  size: 12,
  padding: {
    top: 5, bottom: 5,
    left: 8, right: 8
  },
  borderWidth: {
    top: null, bottom: null,
    left: null, right: null
  }
}

var Table = function(doc, opts, definition) {
  if (typeof opts === 'function') {
    definition = opts
    opts = {}
  }
  
  this.doc  = doc.doc || doc
  this.opts = opts
  
  mergeOption(defaults, this.opts)
  
  this.rows = []
  
  definition.call(this, this)
}

Table.prototype.tr = function(opts, definition) {
  this.rows.push(new Row(this, opts, definition))
}

Table.prototype.render = function(page, width) {
  var columns = [], self = this
  var highestRowWidth = Math.max.apply(Math, this.rows.map(function(row) {
    return row.cells.map(function(cell, i) {
      if (columns[i] === undefined || (cell.width > columns[i] && !(cell.opts.colspan > 1)))
        columns[i] = cell.width
      return cell.width
    }).reduce(function(lhs, rhs) { return lhs + rhs }, 0)
  }))
  
  var maxWidth = width
  if (highestRowWidth > maxWidth) {
    var widthPerCell = maxWidth / columns.length
      , toShrink = []
      , unused = 0
    
    for (var i = 0, len = columns.length; i < len; ++i) {
      if (columns[i] < widthPerCell) unused += widthPerCell - columns[i]
      else toShrink.push(i)
    }
    
    widthPerCell += unused / toShrink.length
    toShrink.forEach(function(i) {
      columns[i] = widthPerCell
    })
  }
  
  var minWidth = this.opts.width || maxWidth
  if (minWidth && highestRowWidth < minWidth) {
    var widthPerCell = minWidth / columns.length
      , toExtend = []
      , used = 0
    
    for (var i = 0, len = columns.length; i < len; ++i) {
      if (columns[i] < widthPerCell) toExtend.push(i)
      used += columns[i]
    }
    
    var add = (minWidth - used) / toExtend.length
    toExtend.forEach(function(i) {
      columns[i] += add
    })
  }
  
  var left = page.cursor.x
  for (var i = 0; i < this.rows.length; ++i) {
    var y = page.cursor.y
      , row = this.rows[i]
  
    var transaction = this.doc.startTransaction()
    
    var height = row.render(page, columns)

    if (height === false) {
      page.cursor.x = left
      page.cursor.y = y

      transaction.rollback()
      row.allowBreak = pagebreak = true
      --i
      if (this.opts.header === true) {
        page = this.doc.pagebreak()
        y = page.cursor.y
        height = this.rows[0].render(page, columns)
      }
    } else {
      transaction.commit()
    }

    page.cursor.x = left
    page.cursor.y = y - height
  }
}

var Row = function(table, opts, definition) {
  if (typeof opts === 'function') {
    definition = opts
    opts = {}
  }
  
  this.table = table
  this.doc   = table.doc
  this.opts  = mergeOption(table.opts, opts)
  
  this.cells = []

  this.allowBreak = false
  
  definition.call(this, this)
}

Object.defineProperties(Row.prototype, {
  isFirstRow: {
    enumerable: true,
    get: function() {
      return this.table.rows.indexOf(this) === 0
    }
  },
  isLastRow: {
    enumerable: true,
    get: function() {
      return this.table.rows.indexOf(this) === this.table.rows.length - 1
    }
  }
})

Row.prototype.td = function(text, opts) {
  var cell = new Cell(this, text, opts)
  this.cells.push(cell)
  return cell
}

Row.prototype.render = function(page, columns) {
  var left = page.cursor.x
    , y = page.cursor.y
    , heights = []
    , borders = []
    , pagebreak = false
    , column = 0
    
  for (var i = 0, len = this.cells.length; i < len; ++i) {
    var cell = this.cells[i]
    
    var width = columns[column++]
    if (cell.opts.colspan > 1) {
      for (var j = column, count = column + cell.opts.colspan - 1; j < count; ++j) {
        width += columns[j] || 0
      }
      column += cell.opts.colspan - 1
    }
    
    !function(x, y, width) {
      borders.push(function(height) {
        cell.drawBorder(page, x, y, width, height)
      })
    }(page.cursor.x, page.cursor.y, width)
    
    var paddingLeft  = cell.borderLeftWidth + cell.opts.padding.left
      , paddingRight = cell.opts.padding.right + cell.borderRightWidth
      , innerWidth   = width - paddingLeft - paddingRight
    page.cursor.x += paddingLeft
    page.cursor.y -= cell.borderTopWidth + cell.opts.padding.top // padding top
    var pageIndex = this.doc.pages.pages.indexOf(page)
    cell.render(page, innerWidth) // below: padding bottom
    var height = pageIndex + 1 < this.doc.pages.count
        ? y - this.doc.padding.bottom
        : y - page.cursor.y + cell.opts.padding.bottom + cell.borderBottomWidth
    for (var j = pageIndex + 1, count = this.doc.pages.count; j < count; ++j) {
      height += this.doc.height - this.doc.padding.top - this.doc.pages.pages[j].cursor.y
    }
    heights.push(height)
    page.cursor.y = y
    page.cursor.x += innerWidth + paddingRight
    
    if (this.doc.cursor !== page && !this.allowBreak) {
      return false
    }
  }

  var height = Math.max.apply(Math, heights)
  borders.forEach(function(border) {
    border(height)
  })
  
  return height
}

var Text = require('./text').Text
  , Fragment = require('../fragment')

var Cell = function(row, text, opts) {
  if (!opts) opts = {}
  
  this.row  = row
  this.doc  = row.doc
  this.opts = mergeOption(row.opts, opts)
  
  if (text instanceof Fragment) {
    this.content = text
    this.contents = text.prepared
  } else {
    this.content = new Fragment(this.doc)
    if (typeof text === 'function') {
      text.call(this.content, this.content)
    } else {
      this.content.text(text, this.opts)
    }
  }
  
  this.innerWidth  = this.content.maxWidth
  this.innerHeight = this.content.minHeight
  
  this.isFirstColumn = this.row.cells.length === 0
  this.isLastColumn  = true
  if (!this.isFirstColumn)
    this.row.cells[this.row.cells.length - 1].isLastColumn = false
}

Cell.prototype.render = function(page, width) {
  this.content.render(page, width)
}

Cell.prototype.drawBorder = function(page, x, y, width, height, splitBelow, splitAbove) {
  if (y - this.doc.padding.bottom < height) {
    var spaceLeft = height - y + this.doc.padding.bottom
    var pageIndex = this.doc.pages.pages.indexOf(page)
    this.drawBorder(page, x, y, width, y - this.doc.padding.bottom, true, false)
    while (spaceLeft > 0) {
      page = this.doc.pages.pages[++pageIndex]
      if (spaceLeft > this.doc.innerHeight) {
        height = this.doc.innerHeight
        this.drawBorder(page, this.doc.padding.left, this.doc.height - this.doc.padding.top, width, height, true, true)
      } else {
        height = spaceLeft // this.doc.height - this.doc.padding.top - page.cursor.y
        this.drawBorder(page, this.doc.padding.left, this.doc.height - this.doc.padding.top, width, height, false, true)
      }
      spaceLeft -= height
    }
    return
  }
  
  
  var border
  // border bottom
  if (this.borderBottomWidth > 0 && !splitBelow) {
    drawLine(page, border = this.borderBottomWidth,
             [x - border / 2, y - height + border / 2],
             [x + width, y - height + border / 2])
  }
    // border top
  if (this.borderTopWidth > 0 && !splitAbove) {
    drawLine(page, border = this.borderTopWidth,
             [x - border / 2, y],
             [x + width, y])
  }
    
  var downTo = y - height
  if (downTo < this.doc.padding.bottom)
    downTo = this.doc.padding.bottom
  
  // border right
  if (this.borderRightWidth > 0) {
    drawLine(page, border = this.borderRightWidth,
             [x + width - border / 2, downTo],
             [x + width - border / 2, y - border / 2])
  }
  
  // border left
  if (this.borderLeftWidth > 0) {
    drawLine(page, border = this.borderLeftWidth,
             [x, y + border / 2],
             [x, downTo])
  }
}

Object.defineProperties(Cell.prototype, {
  width: {
    enumerable: true,
    get: function() {
      return this.borderLeftWidth + this.opts.padding.left
           + this.innerWidth
           + this.opts.padding.right + this.borderRightWidth
    }
  },
  height: {
    enumerable: true,
    get: function() {
      return this.borderTopWidth + this.opts.padding.top
           // + this.opts.font.lineGap / 1000 * this.opts.size
           + this.innerHeight
           + this.opts.padding.bottom + this.borderBottomWidth
    }
  }
})
  
Object.defineProperties(Cell.prototype, {
  borderTopWidth: {
    enumerable: true,
    get: function() {
      var borderWidth = this.opts.borderWidth
      return borderWidth.top || (
        !this.row.isFirstRow ? borderWidth.horizontal || borderWidth.inside || 0
                             : 0
      )
    }
  },
  borderRightWidth: {
    enumerable: true,
    get: function() {
      var borderWidth = this.opts.borderWidth
      return borderWidth.right || (
        !this.isLastColumn ? borderWidth.vertical || borderWidth.inside || 0
                           : 0
      )
    }
  },
  borderBottomWidth: {
    enumerable: true,
    get: function() {
      var borderWidth = this.opts.borderWidth
      return borderWidth.bottom || (
        !this.row.isLastRow ? borderWidth.horizontal || borderWidth.inside || 0
                            : 0
      )
    }
  },
  borderLeftWidth: {
    enumerable: true,
    get: function() {
      var borderWidth = this.opts.borderWidth
      return borderWidth.left || (
        !this.isFirstColumn ? borderWidth.vertical || borderWidth.inside || 0
                            : 0
      )
    }
  }
})

// Helper Functions

function mergeOption(from, into) {
  for (var key in from) {
    var val = into[key]
    if (val === undefined || val === null)
      into[key] = from[key]
    else {
      switch(key) {
      case 'padding':
        val = expandOption(val, { top: 0, right: 0, bottom: 0, left: 0 })
        break
      case 'borderWidth':
        val = expandOption(val, { top: null, right: null, bottom: null, left: null,
                                  inside: null, horizontal: null, vertical: null })
        break
      default:
        continue
      }
      if (typeof val === 'object')
        into[key] = mergeOption(from[key], val)
    } 
  }
  return into
}

function expandOption(option, defaults) {
  if (typeof option === 'object') {
    if (Array.isArray(option)) {
      if (option.length === 2)
        return { top: option[0], right: option[1], bottom: option[0], left: option[1] }
      else
        return { top: option[0], right: option[1], bottom: option[2], left: option[3] }
    } else {
      return mergeOption(defaults, option)
    }
  } else {
    return { top: option, right: option, bottom: option, left: option }    
  }
}

function drawLine(page, width, from, to) {
  page.contents.writeLine('0 0 0 RG')
  page.contents.writeLine(width + ' w')
  page.contents.writeLine(from[0] + ' ' + from[1] + ' m ' + to[0] + ' ' + to[1] + ' l S')
  page.contents.writeLine('')
}
},{"../fragment":7,"../utils":17,"./text":3}],3:[function(require,module,exports){
var PDFString = require('../objects/string')
  , utils = require('../utils')

module.exports = function(string, opts) {
  var text = new Text(this, opts)
  if (typeof string === 'function')
    string.call(text, text.textFn) 
  else
    text.text(string)

  this.contents.push(text)

  return this
}

var Text = module.exports.Text = function(doc, opts) {
  this.doc = doc
  this.opts = opts || {}
  this.contents = []
  this.textFn = this.text.bind(this)
  this.textFn.br = this.text.br.bind(this)
  this.textFn.pageNumber = this.text.pageNumber.bind(this)
  this.textFn.opts = this.opts
}

Text.prototype.text = function text(str, opts) {
  opts = utils.extend(opts || {}, this.opts)
  var self = this, font = (opts.font ? this.doc.registerFont(opts.font) : this.doc.defaultFont).fromOpts(opts)
  var words = str.replace(/\r\n/, '\n').split(/ +|^|$/mg)
  // if (words[0].match(/\.\!\?\,/) && this.contents.length)
  //   this.contents[this.contents.length - 1].content += words.shift()
  words.forEach(function(word) {
    if (!word.length) return
    font.use(word)
    self.contents.push(new Word(word, font, opts))
  })
  return this.textFn
}

Text.prototype.text.br = function() {
  this.contents.push(new Word('\n', this.opts.font ? this.doc.registerFont(opts.font) : this.doc.defaultFont.regular, {}))
  return this.textFn
}

Text.prototype.text.pageNumber = function() {
  this.contents.push(new Word((function() {
    return this.pages.count
  }).bind(this.doc.doc || this.doc), this.opts.font ? this.doc.registerFont(opts.font) : this.doc.defaultFont.regular, {}))
  return this.textFn
}

Text.prototype.render = function(page, width) {
  var self       = this
    , spaceLeft  = width
    , finishedAt = this.contents.length - 1
    , line       = []
    , self       = this
    , lastFont, lastSize
  
  function renderLine(line, textWidth, isLastLine) {
    var lineHeight = Math.max.apply(Math, line.map(function(word) {
      return word.height
    }))
    
    // page break
    if (page.spaceLeft < lineHeight) {
      var left = page.cursor.x
      page = self.doc.pagebreak()
      page.cursor.x = left
      lastFont = undefined
    }
    
    page.cursor.y -= lineHeight
    
    var spaceLeft = width - textWidth
      , left = page.cursor.x
      , wordCount = line.length
      , toPrint = ''

    // begin text
    page.contents.writeLine('BT')
    
    // alignement
    switch (self.opts.align) {
      case 'right':
        left += spaceLeft
        break
      case 'center':
        left += width / 2 - (width - spaceLeft) / 2
        break
      case 'justify':
        if (isLastLine && 100 * spaceLeft / width > 20) break
        var wordSpacing = spaceLeft / (wordCount - 1)
        // set word spacing
        page.contents.writeLine(wordSpacing + ' Tw')
    }
  
    // position the text in user space
    page.contents.writeLine(left + ' ' + page.cursor.y + ' Td')
  
    line.forEach(function(word, i) {
      var str = (i > 0 && !word.isStartingWithPunctuation ? ' ' : '') + word.font.encode(word.word)
        , size = word.opts.size || 10
      if (lastFont !== word.font || lastSize !== size) {
        if (toPrint.length) {
          page.contents.writeLine((new PDFString(toPrint)).toHexString() + ' Tj')
          toPrint = ''
        }
        page.contents.writeLine([word.font.id, size, 'Tf'].join(' '))
        lastFont = word.font
        lastSize = size
      }
      toPrint += str
    })
    if (toPrint.length) {
      page.contents.writeLine((new PDFString(toPrint)).toHexString() + ' Tj')
      toPrint = ''
    }
  
    page.contents.writeLine('ET')
    
    page.cursor.y -= lineHeight * ((self.opts.lineSpacing || 1) - 1)
  }
    
  this.contents.forEach(function(word, i) {
    var wordWidth = word.width, wordSpacing = !line.length || word.isStartingWithPunctuation ? 0 : word.spacing
    
    if (word.word === '\n' || (line.length > 0 && spaceLeft - (wordWidth + wordSpacing) < 0)) {
      wordSpacing = 0
      renderLine(line, width - spaceLeft, word.word === '\n')
      spaceLeft = width
      line = new Line
      if (word.word === '\n') return
    }
    
    spaceLeft -= wordWidth + wordSpacing
    line.push(word)
  })
  
  if (line.length) {
    renderLine(line, width - spaceLeft, true)
  }
}

Object.defineProperties(Text.prototype, {
  maxWidth: {
    enumerable: true,
    get: function() {
      return this.contents.map(function(word, i) {
        return word.width + (i === 0 ? word.spacing : 0)
      }).reduce(function(lhs, rhs) {
        return lhs + rhs
      }, 0)
    }
  },
  minHeight: {
    enumerable: true,
    get: function() {
      return Math.max.apply(Math, this.contents.map(function(word) {
        return word.height
      }))
    }
  }
})

var Word = function(word, font, opts) {
  this._word = word
  this.font = font
  this.opts = opts || {}
  Object.defineProperty(this, 'word', {
    enumerable: true,
    get: function() {
      return this.toString()
    }
  })
}

Object.defineProperties(Word.prototype, {
  width: {
    enumerable: true,
    get: function() {
      return this.font.font.stringWidth(this.word, this.opts.size || 10)
    }
  },
  height: {
    enumerable: true,
    get: function() {
      return this.font.font.lineHeight(this.opts.size || 10, true)
    }
  },
  spacing: {
    enumerable: true,
    get: function() {
      return this.font.font.stringWidth(' ', this.opts.size || 10)
    }
  },
  isStartingWithPunctuation: {
    enumerable: true,
    get: function() {
      return this.word[0].match(/\.|\!|\?|,/) !== null
    }
  }
})

Word.prototype.toString = function() {
  if (typeof this._word === 'function') {
    var res = this._word().toString()
    this.font.use(res)
    return res
  }
  
  return this._word
}

var Line = function() {
  var line = []
  Object.defineProperty(line, 'lineHeight', {
    enumerable: true,
    get: function() {
      return Math.max.apply(Math, this.map(function(word) {
        return word.height
      }))
    }
  })
  return line
}
},{"../objects/string":14,"../utils":17}],4:[function(require,module,exports){
var PDFObject = require('./objects/object')
  , Pages     = require('./pages')
  , Font      = require('./font')
  , TTFFont   = require('./fonts/ttf')
  , PDFName   = require('./objects/name')
  , utils = require('./utils')

var Document = module.exports = function Document(font) {
  this.version = 1.7
  
  // list of all objects in this document
  this.objects   = []
  this.nextObjId = 1
  
  // list of all fonts in this document
  this.fonts       = []
  this.subsets     = []
  this.defaultFont = this.registerFont(font)
  
  // call parents constructor
  Document.super_.call(this, this)
  this.height = 792
  
  // the catalog and pages tree
  this.catalog = this.createObject('Catalog')
  this.pages   = new Pages(this)
  this.catalog.addProperty('Pages', this.pages.toReference())
  
  this.areas = { header: null, footer: null }
}

var Fragment = require('./fragment')
utils.inherits(Document, Fragment);

Document.Font = Font

;['header', 'footer'].forEach(function(area) {
  Document.prototype[area] = function(opts, definition) {
    if (typeof opts !== 'object') {
      definition = opts
      opts = {}
    }
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
  var object = new PDFObject(this.nextObjId++, 0)
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
    this.areas.header.render(page, this.innerWidth)
    this.areas.header.height = this.height - page.cursor.y - this.opts.padding.top
  }
  if (this.areas.footer) {
    var footer = this.areas.footer
      , transaction = this.startTransaction()
      , y = page.cursor.y
    footer.height = 0
    footer.render(page, this.innerWidth)
    var height = y - page.cursor.y
    transaction.rollback()
    page.cursor.y = this.padding.bottom + height
    footer.render(page, this.innerWidth)
    page.cursor.y = y
    footer.height = height
  }
  return page
}

Document.prototype.toDataURL = function() {
  return 'data:application/pdf;base64,' + Base64.encode(this.toString())
}

Document.prototype.toString = function() {
  var self = this
  this.pagebreak()
  this.render()
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
  buf += 'trailer\n'
  buf += '<<\n'
  buf +=   '\t/Size ' + (this.objects.length + 1) + '\n'
  buf +=   '\t/Root ' + this.catalog.toReference().toString() + '\n'
  buf += '>>\n'
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
    this.doc.cursor.contents.content = this.doc.cursor.contents.content.slice(0, this.length)
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
  _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

  // public method for encoding
  encode : function (input) {
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;

    input = Base64._utf8_encode(input);

    while (i < input.length) {
      chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);

      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;

      if (isNaN(chr2)) {
          enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
          enc4 = 64;
      }

      output = output +
      this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
      this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
    }

    return output;
  },

  // private method for UTF-8 encoding
  _utf8_encode : function (string) {
    string = string.replace(/\r\n/g,"\n");
    var utftext = "";

    for (var n = 0; n < string.length; n++) {
      var c = string.charCodeAt(n);

      if (c < 128) {
        utftext += String.fromCharCode(c);
      }
      else if((c > 127) && (c < 2048)) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      }
      else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }
    }

    return utftext;
  }
}
},{"./font":5,"./fonts/ttf":6,"./fragment":7,"./objects/name":10,"./objects/object":11,"./pages":16,"./utils":17}],5:[function(require,module,exports){
var Buffer=require("__browserify_Buffer").Buffer;var TTFFont = require('./fonts/ttf')
  , PDFName = require('./objects/name')
  , fs = require('fs')

var TYPES = ['regular', 'italic', 'bold', 'boldItalic', 'light', 'lightItalic']

var Font = module.exports = function(opts) {
  if (!('regular' in opts)) opts = { regular: opts }
  var self = this
  this.subsets = {}
  TYPES.forEach(function(type) {
    if (type in opts) {
      if (!(opts[type] instanceof ArrayBuffer) && !(opts[type] instanceof Buffer))
        throw new Error('Property `' + type + '` must be a Buffer or a Arraybuffer.')
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
},{"./fonts/ttf":6,"./objects/name":10,"__browserify_Buffer":19,"fs":18}],6:[function(require,module,exports){
var TTFFont = module.exports = require('ttfjs')

var PDFArray  = require('../objects/array')
  , PDFStream = require('../objects/stream')

var embed = TTFFont.Subset.prototype.embed
TTFFont.Subset.prototype.embed = function(doc) {
  embed.call(this)
  
  var font = this.object
  font.prop('Subtype', 'TrueType')
  font.prop('BaseFont', this.font.fontName)
  font.prop('Encoding', 'MacRomanEncoding')
  
  // widths array
  var widths = doc.createObject(), metrics = [], codeMap = this.cmap()
  for (var code in codeMap) {
    if (code < 32) continue
    var gid = codeMap[code]
    metrics.push(Math.round(this.font.tables.hmtx.metrics[gid] * this.font.scaleFactor))
  }
  widths.content = new PDFArray(metrics)
  font.prop('Widths', widths.toReference())
  
  font.prop('FirstChar', 32)
  font.prop('LastChar', metrics.length > (222) ? 225 : metrics.length + 33 - 1)
  
  // font descriptor
  var descriptor = doc.createObject('FontDescriptor')
  descriptor.prop('FontName', this.font.fontName)
  descriptor.prop('Flags', this.font.flags)
  descriptor.prop('FontBBox', new PDFArray(this.font.bbox))
  descriptor.prop('ItalicAngle', this.font.italicAngle)
  descriptor.prop('Ascent', this.font.ascent)
  descriptor.prop('Descent', this.font.descent)
  descriptor.prop('CapHeight', this.font.capHeight)
  descriptor.prop('StemV', this.font.stemV)
  font.prop('FontDescriptor', descriptor.toReference())
  
  // unicode map
  var cmap = new PDFStream(doc.createObject())
  cmap.writeLine('/CIDInit /ProcSet findresource begin')
  cmap.writeLine('12 dict begin')
  cmap.writeLine('begincmap')
  cmap.writeLine('/CIDSystemInfo <<')
  cmap.writeLine('  /Registry (Adobe)')
  cmap.writeLine('  /Ordering (UCS)')
  cmap.writeLine('  /Supplement 0')
  cmap.writeLine('>> def')
  cmap.writeLine('/CMapName /Adobe-Identity-UCS def')
  cmap.writeLine('/CMapType 2 def')
  cmap.writeLine('1 begincodespacerange')
  cmap.writeLine('<00><ff>')
  cmap.writeLine('endcodespacerange')
  
  var codeMap = this.subset, lines = []
  for (var code in codeMap) {
    if (lines.length >= 100) {
      cmap.writeLine(lines.length + ' beginbfchar')
      lines.forEach(function(line) {
        cmap.writeLine(line)
      })
      cmap.writeLine('endbfchar')
      lines = []
    }
    var unicode = ('0000' + codeMap[code].toString(16)).slice(-4)
      , code = (+code).toString(16)
    lines.push('<' + code + '><' + unicode + '>')
  }
  
  if (lines.length) {
    cmap.writeLine(lines.length + ' beginbfchar')
    lines.forEach(function(line) {
      cmap.writeLine(line)
    })
    cmap.writeLine('endbfchar')
  }
  
  cmap.writeLine('endcmap')
  cmap.writeLine('CMapName currentdict /CMap defineresource pop')
  cmap.writeLine('end')
  cmap.writeLine('end')
  
  font.prop('ToUnicode', cmap.toReference())
  
  // font file
  var data = this.font.save()
    , hex = asHex(data)
  
  var file = new PDFStream(doc.createObject())
  file.object.prop('Length', hex.length)
  file.object.prop('Length1', data.byteLength)
  file.object.prop('Filter', 'ASCIIHexDecode')
  file.content = hex + '\n'
  descriptor.prop('FontFile2', file.toReference())
}

Object.defineProperty(TTFFont.Subset.prototype, 'isUsed', {
  enumerable: true,
  get: function() {
    return this.pos > 33
  }
})

TTFFont.Subset.prototype.toReference = function() {
  return this.object.toReference()
}

function toHex(n) {
  if (n < 16) return '0' + n.toString(16);
  return n.toString(16);
}

function asHex(ab) {
  var view = new Uint8Array(ab), hex = ''
  for (var i = 0, len = ab.byteLength; i < len; ++i) {
    hex += toHex(view[i])
  }
  return hex
}

},{"../objects/array":8,"../objects/stream":13,"ttfjs":32}],7:[function(require,module,exports){
var Fragment = module.exports = function(doc, opts) {
  this.opts = opts || {}
  
  this.doc = doc
  
  this.width   = this.opts.width   || 612
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
      return Math.max.apply(Math, this.contents.map(function(content) {
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
  var self = this
  this.contents.forEach(function(content) {
    content.render(self.doc.cursor, width || self.innerWidth)
  })
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
  
  var fragment = new Fragment(this, opts)
  definition.call(fragment, fragment)
  this.contents.push(fragment)
  
  return this
}
},{"./content/operation":1,"./content/table":2,"./content/text":3}],8:[function(require,module,exports){
var PDFArray = module.exports = function(array) {
  if (!array) array = []

  array.toString = function() {
    return '[' +
            this.map(function(item) {
              return item.toString()
            }).join(' ') +
           ']'
  }
  
  return array
}

},{}],9:[function(require,module,exports){
var PDFName = require('./name')

var PDFDictionary = module.exports = function(dictionary) {
  this.dictionary = {}
  if (dictionary) {
    for (var key in dictionary)
      this.add(key, dictionary[key])
  }
}

PDFDictionary.prototype.add = function(key, val) {
  key = new PDFName(key)
  if (typeof val === 'string') val = new PDFName(val)
  this.dictionary[key] = val
}

PDFDictionary.prototype.toString = function() {
  var self = this
  return '<<\n' +
           Object.keys(this.dictionary).map(function(key) {
             return key.toString() + ' ' + self.dictionary[key].toString()
           }).join('\n').replace(/^/gm, '\t') + '\n' +
         '>>'
}

Object.defineProperty(PDFDictionary.prototype, 'length', {
  get: function() {
    return Object.keys(this.dictionary).length
  },
  enumerable: true
})
},{"./name":10}],10:[function(require,module,exports){
var PDFName = module.exports = function(name) {
  if (!name) throw new Error('A Name cannot be undefined')
  
  if (name instanceof PDFName) return name
  name = name.toString()
  
  // white-space characters are not allowed
  if (name.match(/[\x00\x09\x0A\x0C\x0D\x20]/))
    throw new Error('A Name mustn\'t contain white-space characters')

  // delimiter characters are not allowed
  if (name.match(/[\(\)<>\[\]\{\}\/\%]/))
    throw new Error('A Name mustn\'t contain delimiter characters')
  
  this.name = name
}

PDFName.prototype.toString = function() {
  return '/' + this.name
}
},{}],11:[function(require,module,exports){
// > Objects may be labeled so that they can be referred to by other objects.
//   A labeled object is called an indirect object.
// pdfjs just calls them `references`

var PDFReference  = require('./reference')
  , PDFDictionary = require('./dictionary')

var PDFObject = module.exports = function(id, rev) {
  this.id         = id
  this.rev        = rev || 0
  this.properties = new PDFDictionary()
  this.reference  = new PDFReference(this)
  this.content    = null
}

PDFObject.prototype.addProperty = PDFObject.prototype.prop = function(key, val) {
  this.properties.add(key, val)
}

PDFObject.prototype.toReference = function() {
  return this.reference
}

PDFObject.prototype.toString = function() {
  var self = this
  
  return this.id.toString() + ' ' + this.rev + ' obj\n' +
         (this.properties.length ? this.properties.toString() + '\n' : '') +
         (this.content !== null ? this.content.toString() + '\n' : '') +
         'endobj'
}
},{"./dictionary":9,"./reference":12}],12:[function(require,module,exports){
var PDFReference = module.exports = function(object) {
  this.object = object
}

PDFReference.prototype.toString = function() {
  return this.object.id + ' ' + this.object.rev + ' R'
}
},{}],13:[function(require,module,exports){
// page 60
// Filters: page 65

var PDFObject    = require('./name')

var PDFStream = module.exports = function(object) {
  object.content = this
  this.object    = object
  this.content   = ''
}

PDFStream.prototype.writeLine = function(str) {
  this.content += str + '\n'
  this.object.prop('Length', this.content.length)
}

PDFStream.prototype.toReference = function() {
  return this.object.toReference()
}

PDFStream.prototype.toString = function() {
  return 'stream\n' +
         this.content +
         'endstream'
         
}
},{"./name":10}],14:[function(require,module,exports){
var PDFString = module.exports = function(str) {
  this.str = str
}

PDFString.prototype.toLiteralString = function() {
  return '(' + this.str.replace(/\\/g, '\\\\')
                       .replace(/\(/g, '\\(')
                       .replace(/\)/g, '\\)') + ')'
}

PDFString.prototype.toHexString = function() {
  var self = this
  return '<' + ((function() {
    var results = []
    for (var i = 0, len = self.str.length; i < len; ++i) {
      results.push(self.str.charCodeAt(i).toString(16))
    }
    return results
  })()).join('') + '>'
}

PDFString.prototype.toString = function() {
  return this.toHexString()
}
},{}],15:[function(require,module,exports){
var PDFStream     = require('./objects/stream')
  , PDFDictionary = require('./objects/dictionary')
  , PDFArray      = require('./objects/array')
  , PDFName       = require('./objects/name')

var Page = module.exports = function(doc, parent) {
  this.doc        = doc
  this.object     = this.doc.createObject('Page')
  this.contents   = new PDFStream(doc.createObject())
  this.fonts      = new PDFDictionary({})
  this.pageNumber = 1
  
  this.cursor = {
    y: this.doc.height - this.doc.opts.padding.top,
    x: this.doc.padding.left
  }
                    
  this.object.addProperty('Parent', parent.toReference())
  this.object.addProperty('Contents', this.contents.toReference())
  this.object.addProperty('Resources', new PDFDictionary({
    ProcSet: new PDFArray([new PDFName('PDF'), new PDFName('Text'), new PDFName('ImageB'), new PDFName('ImageC'), new PDFName('ImageI')]),
    Font: this.fonts
  }))
}

Object.defineProperties(Page.prototype, {
  spaceLeft: {
    enumerable: true,
    get: function() {
      return this.cursor.y - this.doc.padding.bottom
    }
  }
})

Page.prototype.toReference = function() {
  return this.object.toReference()
}
},{"./objects/array":8,"./objects/dictionary":9,"./objects/name":10,"./objects/stream":13}],16:[function(require,module,exports){
var PDFArray = require('./objects/array')
  , Page = require('./page')

var Pages = module.exports = function(doc) {
  this.doc   = doc
  this.tree  = this.doc.createObject('Pages')
  this.pages = []
  this.kids  = new PDFArray()

  this.tree.addProperty('MediaBox', new PDFArray([0, 0, doc.width, doc.height]))
  this.tree.addProperty('Kids',  this.kids)
  this.tree.addProperty('Count', this.count)
}

Object.defineProperty(Pages.prototype, 'count', {
  get: function() {
    return this.kids.length
  }
})

Pages.prototype.addPage = function() {
  var page = new Page(this.doc, this.tree)

  this.pages.push(page)
  this.kids.push(page.toReference())
  this.tree.addProperty('Count', this.count)
  
  this.doc.subsets.forEach(function(subset) {
    subset.addTo(page)
  })
  
  return page
}

Pages.prototype.removePageAt = function(index) {
  this.pages.splice(index, 1)
  this.kids.splice(index, 1)
  this.tree.addProperty('Count', this.count)
}

Pages.prototype.toReference = function() {
  return this.tree.toReference()
}
},{"./objects/array":8,"./page":15}],17:[function(require,module,exports){
exports.extend = function(destination, source) {
  for (var prop in source) {
    if (prop in destination) continue
    destination[prop] = source[prop]
  }
  return destination
}

exports.inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: { value: ctor, enumerable: false }
  })
}
},{}],18:[function(require,module,exports){
// nothing to see here... no file methods for the browser

},{}],19:[function(require,module,exports){
require=(function(e,t,n,r){function i(r){if(!n[r]){if(!t[r]){if(e)return e(r);throw new Error("Cannot find module '"+r+"'")}var s=n[r]={exports:{}};t[r][0](function(e){var n=t[r][1][e];return i(n?n:e)},s,s.exports)}return n[r].exports}for(var s=0;s<r.length;s++)i(r[s]);return i})(typeof require!=="undefined"&&require,{1:[function(require,module,exports){
// UTILITY
var util = require('util');
var Buffer = require("buffer").Buffer;
var pSlice = Array.prototype.slice;

function objectKeys(object) {
  if (Object.keys) return Object.keys(object);
  var result = [];
  for (var name in object) {
    if (Object.prototype.hasOwnProperty.call(object, name)) {
      result.push(name);
    }
  }
  return result;
}

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.message = options.message;
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
};
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (value === undefined) {
    return '' + value;
  }
  if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {
    return value.toString();
  }
  if (typeof value === 'function' || value instanceof RegExp) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (typeof s == 'string') {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

assert.AssertionError.prototype.toString = function() {
  if (this.message) {
    return [this.name + ':', this.message].join(' ');
  } else {
    return [
      this.name + ':',
      truncate(JSON.stringify(this.actual, replacer), 128),
      this.operator,
      truncate(JSON.stringify(this.expected, replacer), 128)
    ].join(' ');
  }
};

// assert.AssertionError instanceof Error

assert.AssertionError.__proto__ = Error.prototype;

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!!!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (Buffer.isBuffer(actual) && Buffer.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime();

  // 7.3. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (typeof actual != 'object' && typeof expected != 'object') {
    return actual == expected;

  // 7.4. For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isUndefinedOrNull(value) {
  return value === null || value === undefined;
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (expected instanceof RegExp) {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof expected === 'string') {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail('Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail('Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

},{"util":2,"buffer":3}],2:[function(require,module,exports){
var events = require('events');

exports.isArray = isArray;
exports.isDate = function(obj){return Object.prototype.toString.call(obj) === '[object Date]'};
exports.isRegExp = function(obj){return Object.prototype.toString.call(obj) === '[object RegExp]'};


exports.print = function () {};
exports.puts = function () {};
exports.debug = function() {};

exports.inspect = function(obj, showHidden, depth, colors) {
  var seen = [];

  var stylize = function(str, styleType) {
    // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
    var styles =
        { 'bold' : [1, 22],
          'italic' : [3, 23],
          'underline' : [4, 24],
          'inverse' : [7, 27],
          'white' : [37, 39],
          'grey' : [90, 39],
          'black' : [30, 39],
          'blue' : [34, 39],
          'cyan' : [36, 39],
          'green' : [32, 39],
          'magenta' : [35, 39],
          'red' : [31, 39],
          'yellow' : [33, 39] };

    var style =
        { 'special': 'cyan',
          'number': 'blue',
          'boolean': 'yellow',
          'undefined': 'grey',
          'null': 'bold',
          'string': 'green',
          'date': 'magenta',
          // "name": intentionally not styling
          'regexp': 'red' }[styleType];

    if (style) {
      return '\033[' + styles[style][0] + 'm' + str +
             '\033[' + styles[style][1] + 'm';
    } else {
      return str;
    }
  };
  if (! colors) {
    stylize = function(str, styleType) { return str; };
  }

  function format(value, recurseTimes) {
    // Provide a hook for user-specified inspect functions.
    // Check that value is an object with an inspect function on it
    if (value && typeof value.inspect === 'function' &&
        // Filter out the util module, it's inspect function is special
        value !== exports &&
        // Also filter out any prototype objects using the circular check.
        !(value.constructor && value.constructor.prototype === value)) {
      return value.inspect(recurseTimes);
    }

    // Primitive types cannot have properties
    switch (typeof value) {
      case 'undefined':
        return stylize('undefined', 'undefined');

      case 'string':
        var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                                 .replace(/'/g, "\\'")
                                                 .replace(/\\"/g, '"') + '\'';
        return stylize(simple, 'string');

      case 'number':
        return stylize('' + value, 'number');

      case 'boolean':
        return stylize('' + value, 'boolean');
    }
    // For some reason typeof null is "object", so special case here.
    if (value === null) {
      return stylize('null', 'null');
    }

    // Look up the keys of the object.
    var visible_keys = Object_keys(value);
    var keys = showHidden ? Object_getOwnPropertyNames(value) : visible_keys;

    // Functions without properties can be shortcutted.
    if (typeof value === 'function' && keys.length === 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        var name = value.name ? ': ' + value.name : '';
        return stylize('[Function' + name + ']', 'special');
      }
    }

    // Dates without properties can be shortcutted
    if (isDate(value) && keys.length === 0) {
      return stylize(value.toUTCString(), 'date');
    }

    var base, type, braces;
    // Determine the object type
    if (isArray(value)) {
      type = 'Array';
      braces = ['[', ']'];
    } else {
      type = 'Object';
      braces = ['{', '}'];
    }

    // Make functions say that they are functions
    if (typeof value === 'function') {
      var n = value.name ? ': ' + value.name : '';
      base = (isRegExp(value)) ? ' ' + value : ' [Function' + n + ']';
    } else {
      base = '';
    }

    // Make dates with properties first say the date
    if (isDate(value)) {
      base = ' ' + value.toUTCString();
    }

    if (keys.length === 0) {
      return braces[0] + base + braces[1];
    }

    if (recurseTimes < 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        return stylize('[Object]', 'special');
      }
    }

    seen.push(value);

    var output = keys.map(function(key) {
      var name, str;
      if (value.__lookupGetter__) {
        if (value.__lookupGetter__(key)) {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Getter/Setter]', 'special');
          } else {
            str = stylize('[Getter]', 'special');
          }
        } else {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Setter]', 'special');
          }
        }
      }
      if (visible_keys.indexOf(key) < 0) {
        name = '[' + key + ']';
      }
      if (!str) {
        if (seen.indexOf(value[key]) < 0) {
          if (recurseTimes === null) {
            str = format(value[key]);
          } else {
            str = format(value[key], recurseTimes - 1);
          }
          if (str.indexOf('\n') > -1) {
            if (isArray(value)) {
              str = str.split('\n').map(function(line) {
                return '  ' + line;
              }).join('\n').substr(2);
            } else {
              str = '\n' + str.split('\n').map(function(line) {
                return '   ' + line;
              }).join('\n');
            }
          }
        } else {
          str = stylize('[Circular]', 'special');
        }
      }
      if (typeof name === 'undefined') {
        if (type === 'Array' && key.match(/^\d+$/)) {
          return str;
        }
        name = JSON.stringify('' + key);
        if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
          name = name.substr(1, name.length - 2);
          name = stylize(name, 'name');
        } else {
          name = name.replace(/'/g, "\\'")
                     .replace(/\\"/g, '"')
                     .replace(/(^"|"$)/g, "'");
          name = stylize(name, 'string');
        }
      }

      return name + ': ' + str;
    });

    seen.pop();

    var numLinesEst = 0;
    var length = output.reduce(function(prev, cur) {
      numLinesEst++;
      if (cur.indexOf('\n') >= 0) numLinesEst++;
      return prev + cur.length + 1;
    }, 0);

    if (length > 50) {
      output = braces[0] +
               (base === '' ? '' : base + '\n ') +
               ' ' +
               output.join(',\n  ') +
               ' ' +
               braces[1];

    } else {
      output = braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
    }

    return output;
  }
  return format(obj, (typeof depth === 'undefined' ? 2 : depth));
};


function isArray(ar) {
  return ar instanceof Array ||
         Array.isArray(ar) ||
         (ar && ar !== Object.prototype && isArray(ar.__proto__));
}


function isRegExp(re) {
  return re instanceof RegExp ||
    (typeof re === 'object' && Object.prototype.toString.call(re) === '[object RegExp]');
}


function isDate(d) {
  if (d instanceof Date) return true;
  if (typeof d !== 'object') return false;
  var properties = Date.prototype && Object_getOwnPropertyNames(Date.prototype);
  var proto = d.__proto__ && Object_getOwnPropertyNames(d.__proto__);
  return JSON.stringify(proto) === JSON.stringify(properties);
}

function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}

var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}

exports.log = function (msg) {};

exports.pump = null;

var Object_keys = Object.keys || function (obj) {
    var res = [];
    for (var key in obj) res.push(key);
    return res;
};

var Object_getOwnPropertyNames = Object.getOwnPropertyNames || function (obj) {
    var res = [];
    for (var key in obj) {
        if (Object.hasOwnProperty.call(obj, key)) res.push(key);
    }
    return res;
};

var Object_create = Object.create || function (prototype, properties) {
    // from es5-shim
    var object;
    if (prototype === null) {
        object = { '__proto__' : null };
    }
    else {
        if (typeof prototype !== 'object') {
            throw new TypeError(
                'typeof prototype[' + (typeof prototype) + '] != \'object\''
            );
        }
        var Type = function () {};
        Type.prototype = prototype;
        object = new Type();
        object.__proto__ = prototype;
    }
    if (typeof properties !== 'undefined' && Object.defineProperties) {
        Object.defineProperties(object, properties);
    }
    return object;
};

exports.inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object_create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (typeof f !== 'string') {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(exports.inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j': return JSON.stringify(args[i++]);
      default:
        return x;
    }
  });
  for(var x = args[i]; i < len; x = args[++i]){
    if (x === null || typeof x !== 'object') {
      str += ' ' + x;
    } else {
      str += ' ' + exports.inspect(x);
    }
  }
  return str;
};

},{"events":4}],5:[function(require,module,exports){
exports.readIEEE754 = function(buffer, offset, isBE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isBE ? 0 : (nBytes - 1),
      d = isBE ? 1 : -1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.writeIEEE754 = function(buffer, value, offset, isBE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isBE ? (nBytes - 1) : 0,
      d = isBE ? -1 : 1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

},{}],6:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],4:[function(require,module,exports){
(function(process){if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    }
;
function indexOf (xs, x) {
    if (xs.indexOf) return xs.indexOf(x);
    for (var i = 0; i < xs.length; i++) {
        if (x === xs[i]) return i;
    }
    return -1;
}

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = indexOf(list, listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  if (arguments.length === 0) {
    this._events = {};
    return this;
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

})(require("__browserify_process"))
},{"__browserify_process":6}],"buffer-browserify":[function(require,module,exports){
module.exports=require('q9TxCC');
},{}],"q9TxCC":[function(require,module,exports){
function SlowBuffer (size) {
    this.length = size;
};

var assert = require('assert');

exports.INSPECT_MAX_BYTES = 50;


function toHex(n) {
  if (n < 16) return '0' + n.toString(16);
  return n.toString(16);
}

function utf8ToBytes(str) {
  var byteArray = [];
  for (var i = 0; i < str.length; i++)
    if (str.charCodeAt(i) <= 0x7F)
      byteArray.push(str.charCodeAt(i));
    else {
      var h = encodeURIComponent(str.charAt(i)).substr(1).split('%');
      for (var j = 0; j < h.length; j++)
        byteArray.push(parseInt(h[j], 16));
    }

  return byteArray;
}

function asciiToBytes(str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++ )
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push( str.charCodeAt(i) & 0xFF );

  return byteArray;
}

function base64ToBytes(str) {
  return require("base64-js").toByteArray(str);
}

SlowBuffer.byteLength = function (str, encoding) {
  switch (encoding || "utf8") {
    case 'hex':
      return str.length / 2;

    case 'utf8':
    case 'utf-8':
      return utf8ToBytes(str).length;

    case 'ascii':
    case 'binary':
      return str.length;

    case 'base64':
      return base64ToBytes(str).length;

    default:
      throw new Error('Unknown encoding');
  }
};

function blitBuffer(src, dst, offset, length) {
  var pos, i = 0;
  while (i < length) {
    if ((i+offset >= dst.length) || (i >= src.length))
      break;

    dst[i + offset] = src[i];
    i++;
  }
  return i;
}

SlowBuffer.prototype.utf8Write = function (string, offset, length) {
  var bytes, pos;
  return SlowBuffer._charsWritten =  blitBuffer(utf8ToBytes(string), this, offset, length);
};

SlowBuffer.prototype.asciiWrite = function (string, offset, length) {
  var bytes, pos;
  return SlowBuffer._charsWritten =  blitBuffer(asciiToBytes(string), this, offset, length);
};

SlowBuffer.prototype.binaryWrite = SlowBuffer.prototype.asciiWrite;

SlowBuffer.prototype.base64Write = function (string, offset, length) {
  var bytes, pos;
  return SlowBuffer._charsWritten = blitBuffer(base64ToBytes(string), this, offset, length);
};

SlowBuffer.prototype.base64Slice = function (start, end) {
  var bytes = Array.prototype.slice.apply(this, arguments)
  return require("base64-js").fromByteArray(bytes);
}

function decodeUtf8Char(str) {
  try {
    return decodeURIComponent(str);
  } catch (err) {
    return String.fromCharCode(0xFFFD); // UTF 8 invalid char
  }
}

SlowBuffer.prototype.utf8Slice = function () {
  var bytes = Array.prototype.slice.apply(this, arguments);
  var res = "";
  var tmp = "";
  var i = 0;
  while (i < bytes.length) {
    if (bytes[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(bytes[i]);
      tmp = "";
    } else
      tmp += "%" + bytes[i].toString(16);

    i++;
  }

  return res + decodeUtf8Char(tmp);
}

SlowBuffer.prototype.asciiSlice = function () {
  var bytes = Array.prototype.slice.apply(this, arguments);
  var ret = "";
  for (var i = 0; i < bytes.length; i++)
    ret += String.fromCharCode(bytes[i]);
  return ret;
}

SlowBuffer.prototype.binarySlice = SlowBuffer.prototype.asciiSlice;

SlowBuffer.prototype.inspect = function() {
  var out = [],
      len = this.length;
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i]);
    if (i == exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...';
      break;
    }
  }
  return '<SlowBuffer ' + out.join(' ') + '>';
};


SlowBuffer.prototype.hexSlice = function(start, end) {
  var len = this.length;

  if (!start || start < 0) start = 0;
  if (!end || end < 0 || end > len) end = len;

  var out = '';
  for (var i = start; i < end; i++) {
    out += toHex(this[i]);
  }
  return out;
};


SlowBuffer.prototype.toString = function(encoding, start, end) {
  encoding = String(encoding || 'utf8').toLowerCase();
  start = +start || 0;
  if (typeof end == 'undefined') end = this.length;

  // Fastpath empty strings
  if (+end == start) {
    return '';
  }

  switch (encoding) {
    case 'hex':
      return this.hexSlice(start, end);

    case 'utf8':
    case 'utf-8':
      return this.utf8Slice(start, end);

    case 'ascii':
      return this.asciiSlice(start, end);

    case 'binary':
      return this.binarySlice(start, end);

    case 'base64':
      return this.base64Slice(start, end);

    case 'ucs2':
    case 'ucs-2':
      return this.ucs2Slice(start, end);

    default:
      throw new Error('Unknown encoding');
  }
};


SlowBuffer.prototype.hexWrite = function(string, offset, length) {
  offset = +offset || 0;
  var remaining = this.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = +length;
    if (length > remaining) {
      length = remaining;
    }
  }

  // must be an even number of digits
  var strLen = string.length;
  if (strLen % 2) {
    throw new Error('Invalid hex string');
  }
  if (length > strLen / 2) {
    length = strLen / 2;
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16);
    if (isNaN(byte)) throw new Error('Invalid hex string');
    this[offset + i] = byte;
  }
  SlowBuffer._charsWritten = i * 2;
  return i;
};


SlowBuffer.prototype.write = function(string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length;
      length = undefined;
    }
  } else {  // legacy
    var swap = encoding;
    encoding = offset;
    offset = length;
    length = swap;
  }

  offset = +offset || 0;
  var remaining = this.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = +length;
    if (length > remaining) {
      length = remaining;
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase();

  switch (encoding) {
    case 'hex':
      return this.hexWrite(string, offset, length);

    case 'utf8':
    case 'utf-8':
      return this.utf8Write(string, offset, length);

    case 'ascii':
      return this.asciiWrite(string, offset, length);

    case 'binary':
      return this.binaryWrite(string, offset, length);

    case 'base64':
      return this.base64Write(string, offset, length);

    case 'ucs2':
    case 'ucs-2':
      return this.ucs2Write(string, offset, length);

    default:
      throw new Error('Unknown encoding');
  }
};


// slice(start, end)
SlowBuffer.prototype.slice = function(start, end) {
  if (end === undefined) end = this.length;

  if (end > this.length) {
    throw new Error('oob');
  }
  if (start > end) {
    throw new Error('oob');
  }

  return new Buffer(this, end - start, +start);
};

SlowBuffer.prototype.copy = function(target, targetstart, sourcestart, sourceend) {
  var temp = [];
  for (var i=sourcestart; i<sourceend; i++) {
    assert.ok(typeof this[i] !== 'undefined', "copying undefined buffer bytes!");
    temp.push(this[i]);
  }

  for (var i=targetstart; i<targetstart+temp.length; i++) {
    target[i] = temp[i-targetstart];
  }
};

SlowBuffer.prototype.fill = function(value, start, end) {
  if (end > this.length) {
    throw new Error('oob');
  }
  if (start > end) {
    throw new Error('oob');
  }

  for (var i = start; i < end; i++) {
    this[i] = value;
  }
}

function coerce(length) {
  // Coerce length to a number (possibly NaN), round up
  // in case it's fractional (e.g. 123.456) then do a
  // double negate to coerce a NaN to 0. Easy, right?
  length = ~~Math.ceil(+length);
  return length < 0 ? 0 : length;
}


// Buffer

function Buffer(subject, encoding, offset) {
  if (!(this instanceof Buffer)) {
    return new Buffer(subject, encoding, offset);
  }

  var type;

  // Are we slicing?
  if (typeof offset === 'number') {
    this.length = coerce(encoding);
    this.parent = subject;
    this.offset = offset;
  } else {
    // Find the length
    switch (type = typeof subject) {
      case 'number':
        this.length = coerce(subject);
        break;

      case 'string':
        this.length = Buffer.byteLength(subject, encoding);
        break;

      case 'object': // Assume object is an array
        this.length = coerce(subject.length);
        break;

      default:
        throw new Error('First argument needs to be a number, ' +
                        'array or string.');
    }

    if (this.length > Buffer.poolSize) {
      // Big buffer, just alloc one.
      this.parent = new SlowBuffer(this.length);
      this.offset = 0;

    } else {
      // Small buffer.
      if (!pool || pool.length - pool.used < this.length) allocPool();
      this.parent = pool;
      this.offset = pool.used;
      pool.used += this.length;
    }

    // Treat array-ish objects as a byte array.
    if (isArrayIsh(subject)) {
      for (var i = 0; i < this.length; i++) {
        if (subject instanceof Buffer) {
          this.parent[i + this.offset] = subject.readUInt8(i);
        }
        else {
          this.parent[i + this.offset] = subject[i];
        }
      }
    } else if (type == 'string') {
      // We are a string
      this.length = this.write(subject, 0, encoding);
    }
  }

}

function isArrayIsh(subject) {
  return Array.isArray(subject) || Buffer.isBuffer(subject) ||
         subject && typeof subject === 'object' &&
         typeof subject.length === 'number';
}

exports.SlowBuffer = SlowBuffer;
exports.Buffer = Buffer;

Buffer.poolSize = 8 * 1024;
var pool;

function allocPool() {
  pool = new SlowBuffer(Buffer.poolSize);
  pool.used = 0;
}


// Static methods
Buffer.isBuffer = function isBuffer(b) {
  return b instanceof Buffer || b instanceof SlowBuffer;
};

Buffer.concat = function (list, totalLength) {
  if (!Array.isArray(list)) {
    throw new Error("Usage: Buffer.concat(list, [totalLength])\n \
      list should be an Array.");
  }

  if (list.length === 0) {
    return new Buffer(0);
  } else if (list.length === 1) {
    return list[0];
  }

  if (typeof totalLength !== 'number') {
    totalLength = 0;
    for (var i = 0; i < list.length; i++) {
      var buf = list[i];
      totalLength += buf.length;
    }
  }

  var buffer = new Buffer(totalLength);
  var pos = 0;
  for (var i = 0; i < list.length; i++) {
    var buf = list[i];
    buf.copy(buffer, pos);
    pos += buf.length;
  }
  return buffer;
};

// Inspect
Buffer.prototype.inspect = function inspect() {
  var out = [],
      len = this.length;

  for (var i = 0; i < len; i++) {
    out[i] = toHex(this.parent[i + this.offset]);
    if (i == exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...';
      break;
    }
  }

  return '<Buffer ' + out.join(' ') + '>';
};


Buffer.prototype.get = function get(i) {
  if (i < 0 || i >= this.length) throw new Error('oob');
  return this.parent[this.offset + i];
};


Buffer.prototype.set = function set(i, v) {
  if (i < 0 || i >= this.length) throw new Error('oob');
  return this.parent[this.offset + i] = v;
};


// write(string, offset = 0, length = buffer.length-offset, encoding = 'utf8')
Buffer.prototype.write = function(string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length;
      length = undefined;
    }
  } else {  // legacy
    var swap = encoding;
    encoding = offset;
    offset = length;
    length = swap;
  }

  offset = +offset || 0;
  var remaining = this.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = +length;
    if (length > remaining) {
      length = remaining;
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase();

  var ret;
  switch (encoding) {
    case 'hex':
      ret = this.parent.hexWrite(string, this.offset + offset, length);
      break;

    case 'utf8':
    case 'utf-8':
      ret = this.parent.utf8Write(string, this.offset + offset, length);
      break;

    case 'ascii':
      ret = this.parent.asciiWrite(string, this.offset + offset, length);
      break;

    case 'binary':
      ret = this.parent.binaryWrite(string, this.offset + offset, length);
      break;

    case 'base64':
      // Warning: maxLength not taken into account in base64Write
      ret = this.parent.base64Write(string, this.offset + offset, length);
      break;

    case 'ucs2':
    case 'ucs-2':
      ret = this.parent.ucs2Write(string, this.offset + offset, length);
      break;

    default:
      throw new Error('Unknown encoding');
  }

  Buffer._charsWritten = SlowBuffer._charsWritten;

  return ret;
};


// toString(encoding, start=0, end=buffer.length)
Buffer.prototype.toString = function(encoding, start, end) {
  encoding = String(encoding || 'utf8').toLowerCase();

  if (typeof start == 'undefined' || start < 0) {
    start = 0;
  } else if (start > this.length) {
    start = this.length;
  }

  if (typeof end == 'undefined' || end > this.length) {
    end = this.length;
  } else if (end < 0) {
    end = 0;
  }

  start = start + this.offset;
  end = end + this.offset;

  switch (encoding) {
    case 'hex':
      return this.parent.hexSlice(start, end);

    case 'utf8':
    case 'utf-8':
      return this.parent.utf8Slice(start, end);

    case 'ascii':
      return this.parent.asciiSlice(start, end);

    case 'binary':
      return this.parent.binarySlice(start, end);

    case 'base64':
      return this.parent.base64Slice(start, end);

    case 'ucs2':
    case 'ucs-2':
      return this.parent.ucs2Slice(start, end);

    default:
      throw new Error('Unknown encoding');
  }
};


// byteLength
Buffer.byteLength = SlowBuffer.byteLength;


// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill(value, start, end) {
  value || (value = 0);
  start || (start = 0);
  end || (end = this.length);

  if (typeof value === 'string') {
    value = value.charCodeAt(0);
  }
  if (!(typeof value === 'number') || isNaN(value)) {
    throw new Error('value is not a number');
  }

  if (end < start) throw new Error('end < start');

  // Fill 0 bytes; we're done
  if (end === start) return 0;
  if (this.length == 0) return 0;

  if (start < 0 || start >= this.length) {
    throw new Error('start out of bounds');
  }

  if (end < 0 || end > this.length) {
    throw new Error('end out of bounds');
  }

  return this.parent.fill(value,
                          start + this.offset,
                          end + this.offset);
};


// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function(target, target_start, start, end) {
  var source = this;
  start || (start = 0);
  end || (end = this.length);
  target_start || (target_start = 0);

  if (end < start) throw new Error('sourceEnd < sourceStart');

  // Copy 0 bytes; we're done
  if (end === start) return 0;
  if (target.length == 0 || source.length == 0) return 0;

  if (target_start < 0 || target_start >= target.length) {
    throw new Error('targetStart out of bounds');
  }

  if (start < 0 || start >= source.length) {
    throw new Error('sourceStart out of bounds');
  }

  if (end < 0 || end > source.length) {
    throw new Error('sourceEnd out of bounds');
  }

  // Are we oob?
  if (end > this.length) {
    end = this.length;
  }

  if (target.length - target_start < end - start) {
    end = target.length - target_start + start;
  }

  return this.parent.copy(target.parent,
                          target_start + target.offset,
                          start + this.offset,
                          end + this.offset);
};


// slice(start, end)
Buffer.prototype.slice = function(start, end) {
  if (end === undefined) end = this.length;
  if (end > this.length) throw new Error('oob');
  if (start > end) throw new Error('oob');

  return new Buffer(this.parent, end - start, +start + this.offset);
};


// Legacy methods for backwards compatibility.

Buffer.prototype.utf8Slice = function(start, end) {
  return this.toString('utf8', start, end);
};

Buffer.prototype.binarySlice = function(start, end) {
  return this.toString('binary', start, end);
};

Buffer.prototype.asciiSlice = function(start, end) {
  return this.toString('ascii', start, end);
};

Buffer.prototype.utf8Write = function(string, offset) {
  return this.write(string, offset, 'utf8');
};

Buffer.prototype.binaryWrite = function(string, offset) {
  return this.write(string, offset, 'binary');
};

Buffer.prototype.asciiWrite = function(string, offset) {
  return this.write(string, offset, 'ascii');
};

Buffer.prototype.readUInt8 = function(offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (offset >= buffer.length) return;

  return buffer.parent[buffer.offset + offset];
};

function readUInt16(buffer, offset, isBigEndian, noAssert) {
  var val = 0;


  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (offset >= buffer.length) return 0;

  if (isBigEndian) {
    val = buffer.parent[buffer.offset + offset] << 8;
    if (offset + 1 < buffer.length) {
      val |= buffer.parent[buffer.offset + offset + 1];
    }
  } else {
    val = buffer.parent[buffer.offset + offset];
    if (offset + 1 < buffer.length) {
      val |= buffer.parent[buffer.offset + offset + 1] << 8;
    }
  }

  return val;
}

Buffer.prototype.readUInt16LE = function(offset, noAssert) {
  return readUInt16(this, offset, false, noAssert);
};

Buffer.prototype.readUInt16BE = function(offset, noAssert) {
  return readUInt16(this, offset, true, noAssert);
};

function readUInt32(buffer, offset, isBigEndian, noAssert) {
  var val = 0;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (offset >= buffer.length) return 0;

  if (isBigEndian) {
    if (offset + 1 < buffer.length)
      val = buffer.parent[buffer.offset + offset + 1] << 16;
    if (offset + 2 < buffer.length)
      val |= buffer.parent[buffer.offset + offset + 2] << 8;
    if (offset + 3 < buffer.length)
      val |= buffer.parent[buffer.offset + offset + 3];
    val = val + (buffer.parent[buffer.offset + offset] << 24 >>> 0);
  } else {
    if (offset + 2 < buffer.length)
      val = buffer.parent[buffer.offset + offset + 2] << 16;
    if (offset + 1 < buffer.length)
      val |= buffer.parent[buffer.offset + offset + 1] << 8;
    val |= buffer.parent[buffer.offset + offset];
    if (offset + 3 < buffer.length)
      val = val + (buffer.parent[buffer.offset + offset + 3] << 24 >>> 0);
  }

  return val;
}

Buffer.prototype.readUInt32LE = function(offset, noAssert) {
  return readUInt32(this, offset, false, noAssert);
};

Buffer.prototype.readUInt32BE = function(offset, noAssert) {
  return readUInt32(this, offset, true, noAssert);
};


/*
 * Signed integer types, yay team! A reminder on how two's complement actually
 * works. The first bit is the signed bit, i.e. tells us whether or not the
 * number should be positive or negative. If the two's complement value is
 * positive, then we're done, as it's equivalent to the unsigned representation.
 *
 * Now if the number is positive, you're pretty much done, you can just leverage
 * the unsigned translations and return those. Unfortunately, negative numbers
 * aren't quite that straightforward.
 *
 * At first glance, one might be inclined to use the traditional formula to
 * translate binary numbers between the positive and negative values in two's
 * complement. (Though it doesn't quite work for the most negative value)
 * Mainly:
 *  - invert all the bits
 *  - add one to the result
 *
 * Of course, this doesn't quite work in Javascript. Take for example the value
 * of -128. This could be represented in 16 bits (big-endian) as 0xff80. But of
 * course, Javascript will do the following:
 *
 * > ~0xff80
 * -65409
 *
 * Whoh there, Javascript, that's not quite right. But wait, according to
 * Javascript that's perfectly correct. When Javascript ends up seeing the
 * constant 0xff80, it has no notion that it is actually a signed number. It
 * assumes that we've input the unsigned value 0xff80. Thus, when it does the
 * binary negation, it casts it into a signed value, (positive 0xff80). Then
 * when you perform binary negation on that, it turns it into a negative number.
 *
 * Instead, we're going to have to use the following general formula, that works
 * in a rather Javascript friendly way. I'm glad we don't support this kind of
 * weird numbering scheme in the kernel.
 *
 * (BIT-MAX - (unsigned)val + 1) * -1
 *
 * The astute observer, may think that this doesn't make sense for 8-bit numbers
 * (really it isn't necessary for them). However, when you get 16-bit numbers,
 * you do. Let's go back to our prior example and see how this will look:
 *
 * (0xffff - 0xff80 + 1) * -1
 * (0x007f + 1) * -1
 * (0x0080) * -1
 */
Buffer.prototype.readInt8 = function(offset, noAssert) {
  var buffer = this;
  var neg;

  if (!noAssert) {
    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (offset >= buffer.length) return;

  neg = buffer.parent[buffer.offset + offset] & 0x80;
  if (!neg) {
    return (buffer.parent[buffer.offset + offset]);
  }

  return ((0xff - buffer.parent[buffer.offset + offset] + 1) * -1);
};

function readInt16(buffer, offset, isBigEndian, noAssert) {
  var neg, val;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to read beyond buffer length');
  }

  val = readUInt16(buffer, offset, isBigEndian, noAssert);
  neg = val & 0x8000;
  if (!neg) {
    return val;
  }

  return (0xffff - val + 1) * -1;
}

Buffer.prototype.readInt16LE = function(offset, noAssert) {
  return readInt16(this, offset, false, noAssert);
};

Buffer.prototype.readInt16BE = function(offset, noAssert) {
  return readInt16(this, offset, true, noAssert);
};

function readInt32(buffer, offset, isBigEndian, noAssert) {
  var neg, val;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  val = readUInt32(buffer, offset, isBigEndian, noAssert);
  neg = val & 0x80000000;
  if (!neg) {
    return (val);
  }

  return (0xffffffff - val + 1) * -1;
}

Buffer.prototype.readInt32LE = function(offset, noAssert) {
  return readInt32(this, offset, false, noAssert);
};

Buffer.prototype.readInt32BE = function(offset, noAssert) {
  return readInt32(this, offset, true, noAssert);
};

function readFloat(buffer, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  return require('./buffer_ieee754').readIEEE754(buffer, offset, isBigEndian,
      23, 4);
}

Buffer.prototype.readFloatLE = function(offset, noAssert) {
  return readFloat(this, offset, false, noAssert);
};

Buffer.prototype.readFloatBE = function(offset, noAssert) {
  return readFloat(this, offset, true, noAssert);
};

function readDouble(buffer, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset + 7 < buffer.length,
        'Trying to read beyond buffer length');
  }

  return require('./buffer_ieee754').readIEEE754(buffer, offset, isBigEndian,
      52, 8);
}

Buffer.prototype.readDoubleLE = function(offset, noAssert) {
  return readDouble(this, offset, false, noAssert);
};

Buffer.prototype.readDoubleBE = function(offset, noAssert) {
  return readDouble(this, offset, true, noAssert);
};


/*
 * We have to make sure that the value is a valid integer. This means that it is
 * non-negative. It has no fractional component and that it does not exceed the
 * maximum allowed value.
 *
 *      value           The number to check for validity
 *
 *      max             The maximum value
 */
function verifuint(value, max) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value >= 0,
      'specified a negative value for writing an unsigned value');

  assert.ok(value <= max, 'value is larger than maximum value for type');

  assert.ok(Math.floor(value) === value, 'value has a fractional component');
}

Buffer.prototype.writeUInt8 = function(value, offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xff);
  }

  if (offset < buffer.length) {
    buffer.parent[buffer.offset + offset] = value;
  }
};

function writeUInt16(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xffff);
  }

  for (var i = 0; i < Math.min(buffer.length - offset, 2); i++) {
    buffer.parent[buffer.offset + offset + i] =
        (value & (0xff << (8 * (isBigEndian ? 1 - i : i)))) >>>
            (isBigEndian ? 1 - i : i) * 8;
  }

}

Buffer.prototype.writeUInt16LE = function(value, offset, noAssert) {
  writeUInt16(this, value, offset, false, noAssert);
};

Buffer.prototype.writeUInt16BE = function(value, offset, noAssert) {
  writeUInt16(this, value, offset, true, noAssert);
};

function writeUInt32(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xffffffff);
  }

  for (var i = 0; i < Math.min(buffer.length - offset, 4); i++) {
    buffer.parent[buffer.offset + offset + i] =
        (value >>> (isBigEndian ? 3 - i : i) * 8) & 0xff;
  }
}

Buffer.prototype.writeUInt32LE = function(value, offset, noAssert) {
  writeUInt32(this, value, offset, false, noAssert);
};

Buffer.prototype.writeUInt32BE = function(value, offset, noAssert) {
  writeUInt32(this, value, offset, true, noAssert);
};


/*
 * We now move onto our friends in the signed number category. Unlike unsigned
 * numbers, we're going to have to worry a bit more about how we put values into
 * arrays. Since we are only worrying about signed 32-bit values, we're in
 * slightly better shape. Unfortunately, we really can't do our favorite binary
 * & in this system. It really seems to do the wrong thing. For example:
 *
 * > -32 & 0xff
 * 224
 *
 * What's happening above is really: 0xe0 & 0xff = 0xe0. However, the results of
 * this aren't treated as a signed number. Ultimately a bad thing.
 *
 * What we're going to want to do is basically create the unsigned equivalent of
 * our representation and pass that off to the wuint* functions. To do that
 * we're going to do the following:
 *
 *  - if the value is positive
 *      we can pass it directly off to the equivalent wuint
 *  - if the value is negative
 *      we do the following computation:
 *         mb + val + 1, where
 *         mb   is the maximum unsigned value in that byte size
 *         val  is the Javascript negative integer
 *
 *
 * As a concrete value, take -128. In signed 16 bits this would be 0xff80. If
 * you do out the computations:
 *
 * 0xffff - 128 + 1
 * 0xffff - 127
 * 0xff80
 *
 * You can then encode this value as the signed version. This is really rather
 * hacky, but it should work and get the job done which is our goal here.
 */

/*
 * A series of checks to make sure we actually have a signed 32-bit number
 */
function verifsint(value, max, min) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value <= max, 'value larger than maximum allowed value');

  assert.ok(value >= min, 'value smaller than minimum allowed value');

  assert.ok(Math.floor(value) === value, 'value has a fractional component');
}

function verifIEEE754(value, max, min) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value <= max, 'value larger than maximum allowed value');

  assert.ok(value >= min, 'value smaller than minimum allowed value');
}

Buffer.prototype.writeInt8 = function(value, offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7f, -0x80);
  }

  if (value >= 0) {
    buffer.writeUInt8(value, offset, noAssert);
  } else {
    buffer.writeUInt8(0xff + value + 1, offset, noAssert);
  }
};

function writeInt16(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7fff, -0x8000);
  }

  if (value >= 0) {
    writeUInt16(buffer, value, offset, isBigEndian, noAssert);
  } else {
    writeUInt16(buffer, 0xffff + value + 1, offset, isBigEndian, noAssert);
  }
}

Buffer.prototype.writeInt16LE = function(value, offset, noAssert) {
  writeInt16(this, value, offset, false, noAssert);
};

Buffer.prototype.writeInt16BE = function(value, offset, noAssert) {
  writeInt16(this, value, offset, true, noAssert);
};

function writeInt32(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7fffffff, -0x80000000);
  }

  if (value >= 0) {
    writeUInt32(buffer, value, offset, isBigEndian, noAssert);
  } else {
    writeUInt32(buffer, 0xffffffff + value + 1, offset, isBigEndian, noAssert);
  }
}

Buffer.prototype.writeInt32LE = function(value, offset, noAssert) {
  writeInt32(this, value, offset, false, noAssert);
};

Buffer.prototype.writeInt32BE = function(value, offset, noAssert) {
  writeInt32(this, value, offset, true, noAssert);
};

function writeFloat(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to write beyond buffer length');

    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38);
  }

  require('./buffer_ieee754').writeIEEE754(buffer, value, offset, isBigEndian,
      23, 4);
}

Buffer.prototype.writeFloatLE = function(value, offset, noAssert) {
  writeFloat(this, value, offset, false, noAssert);
};

Buffer.prototype.writeFloatBE = function(value, offset, noAssert) {
  writeFloat(this, value, offset, true, noAssert);
};

function writeDouble(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 7 < buffer.length,
        'Trying to write beyond buffer length');

    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308);
  }

  require('./buffer_ieee754').writeIEEE754(buffer, value, offset, isBigEndian,
      52, 8);
}

Buffer.prototype.writeDoubleLE = function(value, offset, noAssert) {
  writeDouble(this, value, offset, false, noAssert);
};

Buffer.prototype.writeDoubleBE = function(value, offset, noAssert) {
  writeDouble(this, value, offset, true, noAssert);
};

SlowBuffer.prototype.readUInt8 = Buffer.prototype.readUInt8;
SlowBuffer.prototype.readUInt16LE = Buffer.prototype.readUInt16LE;
SlowBuffer.prototype.readUInt16BE = Buffer.prototype.readUInt16BE;
SlowBuffer.prototype.readUInt32LE = Buffer.prototype.readUInt32LE;
SlowBuffer.prototype.readUInt32BE = Buffer.prototype.readUInt32BE;
SlowBuffer.prototype.readInt8 = Buffer.prototype.readInt8;
SlowBuffer.prototype.readInt16LE = Buffer.prototype.readInt16LE;
SlowBuffer.prototype.readInt16BE = Buffer.prototype.readInt16BE;
SlowBuffer.prototype.readInt32LE = Buffer.prototype.readInt32LE;
SlowBuffer.prototype.readInt32BE = Buffer.prototype.readInt32BE;
SlowBuffer.prototype.readFloatLE = Buffer.prototype.readFloatLE;
SlowBuffer.prototype.readFloatBE = Buffer.prototype.readFloatBE;
SlowBuffer.prototype.readDoubleLE = Buffer.prototype.readDoubleLE;
SlowBuffer.prototype.readDoubleBE = Buffer.prototype.readDoubleBE;
SlowBuffer.prototype.writeUInt8 = Buffer.prototype.writeUInt8;
SlowBuffer.prototype.writeUInt16LE = Buffer.prototype.writeUInt16LE;
SlowBuffer.prototype.writeUInt16BE = Buffer.prototype.writeUInt16BE;
SlowBuffer.prototype.writeUInt32LE = Buffer.prototype.writeUInt32LE;
SlowBuffer.prototype.writeUInt32BE = Buffer.prototype.writeUInt32BE;
SlowBuffer.prototype.writeInt8 = Buffer.prototype.writeInt8;
SlowBuffer.prototype.writeInt16LE = Buffer.prototype.writeInt16LE;
SlowBuffer.prototype.writeInt16BE = Buffer.prototype.writeInt16BE;
SlowBuffer.prototype.writeInt32LE = Buffer.prototype.writeInt32LE;
SlowBuffer.prototype.writeInt32BE = Buffer.prototype.writeInt32BE;
SlowBuffer.prototype.writeFloatLE = Buffer.prototype.writeFloatLE;
SlowBuffer.prototype.writeFloatBE = Buffer.prototype.writeFloatBE;
SlowBuffer.prototype.writeDoubleLE = Buffer.prototype.writeDoubleLE;
SlowBuffer.prototype.writeDoubleBE = Buffer.prototype.writeDoubleBE;

},{"assert":1,"./buffer_ieee754":5,"base64-js":7}],7:[function(require,module,exports){
(function (exports) {
	'use strict';

	var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	function b64ToByteArray(b64) {
		var i, j, l, tmp, placeHolders, arr;
	
		if (b64.length % 4 > 0) {
			throw 'Invalid string. Length must be a multiple of 4';
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		placeHolders = b64.indexOf('=');
		placeHolders = placeHolders > 0 ? b64.length - placeHolders : 0;

		// base64 is 4/3 + up to two characters of the original data
		arr = [];//new Uint8Array(b64.length * 3 / 4 - placeHolders);

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length;

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (lookup.indexOf(b64[i]) << 18) | (lookup.indexOf(b64[i + 1]) << 12) | (lookup.indexOf(b64[i + 2]) << 6) | lookup.indexOf(b64[i + 3]);
			arr.push((tmp & 0xFF0000) >> 16);
			arr.push((tmp & 0xFF00) >> 8);
			arr.push(tmp & 0xFF);
		}

		if (placeHolders === 2) {
			tmp = (lookup.indexOf(b64[i]) << 2) | (lookup.indexOf(b64[i + 1]) >> 4);
			arr.push(tmp & 0xFF);
		} else if (placeHolders === 1) {
			tmp = (lookup.indexOf(b64[i]) << 10) | (lookup.indexOf(b64[i + 1]) << 4) | (lookup.indexOf(b64[i + 2]) >> 2);
			arr.push((tmp >> 8) & 0xFF);
			arr.push(tmp & 0xFF);
		}

		return arr;
	}

	function uint8ToBase64(uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length;

		function tripletToBase64 (num) {
			return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
		};

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
			output += tripletToBase64(temp);
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1];
				output += lookup[temp >> 2];
				output += lookup[(temp << 4) & 0x3F];
				output += '==';
				break;
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1]);
				output += lookup[temp >> 10];
				output += lookup[(temp >> 4) & 0x3F];
				output += lookup[(temp << 2) & 0x3F];
				output += '=';
				break;
		}

		return output;
	}

	module.exports.toByteArray = b64ToByteArray;
	module.exports.fromByteArray = uint8ToBase64;
}());

},{}],8:[function(require,module,exports){
exports.readIEEE754 = function(buffer, offset, isBE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isBE ? 0 : (nBytes - 1),
      d = isBE ? 1 : -1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.writeIEEE754 = function(buffer, value, offset, isBE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isBE ? (nBytes - 1) : 0,
      d = isBE ? -1 : 1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

},{}],3:[function(require,module,exports){
function SlowBuffer (size) {
    this.length = size;
};

var assert = require('assert');

exports.INSPECT_MAX_BYTES = 50;


function toHex(n) {
  if (n < 16) return '0' + n.toString(16);
  return n.toString(16);
}

function utf8ToBytes(str) {
  var byteArray = [];
  for (var i = 0; i < str.length; i++)
    if (str.charCodeAt(i) <= 0x7F)
      byteArray.push(str.charCodeAt(i));
    else {
      var h = encodeURIComponent(str.charAt(i)).substr(1).split('%');
      for (var j = 0; j < h.length; j++)
        byteArray.push(parseInt(h[j], 16));
    }

  return byteArray;
}

function asciiToBytes(str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++ )
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push( str.charCodeAt(i) & 0xFF );

  return byteArray;
}

function base64ToBytes(str) {
  return require("base64-js").toByteArray(str);
}

SlowBuffer.byteLength = function (str, encoding) {
  switch (encoding || "utf8") {
    case 'hex':
      return str.length / 2;

    case 'utf8':
    case 'utf-8':
      return utf8ToBytes(str).length;

    case 'ascii':
      return str.length;

    case 'base64':
      return base64ToBytes(str).length;

    default:
      throw new Error('Unknown encoding');
  }
};

function blitBuffer(src, dst, offset, length) {
  var pos, i = 0;
  while (i < length) {
    if ((i+offset >= dst.length) || (i >= src.length))
      break;

    dst[i + offset] = src[i];
    i++;
  }
  return i;
}

SlowBuffer.prototype.utf8Write = function (string, offset, length) {
  var bytes, pos;
  return SlowBuffer._charsWritten =  blitBuffer(utf8ToBytes(string), this, offset, length);
};

SlowBuffer.prototype.asciiWrite = function (string, offset, length) {
  var bytes, pos;
  return SlowBuffer._charsWritten =  blitBuffer(asciiToBytes(string), this, offset, length);
};

SlowBuffer.prototype.base64Write = function (string, offset, length) {
  var bytes, pos;
  return SlowBuffer._charsWritten = blitBuffer(base64ToBytes(string), this, offset, length);
};

SlowBuffer.prototype.base64Slice = function (start, end) {
  var bytes = Array.prototype.slice.apply(this, arguments)
  return require("base64-js").fromByteArray(bytes);
}

function decodeUtf8Char(str) {
  try {
    return decodeURIComponent(str);
  } catch (err) {
    return String.fromCharCode(0xFFFD); // UTF 8 invalid char
  }
}

SlowBuffer.prototype.utf8Slice = function () {
  var bytes = Array.prototype.slice.apply(this, arguments);
  var res = "";
  var tmp = "";
  var i = 0;
  while (i < bytes.length) {
    if (bytes[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(bytes[i]);
      tmp = "";
    } else
      tmp += "%" + bytes[i].toString(16);

    i++;
  }

  return res + decodeUtf8Char(tmp);
}

SlowBuffer.prototype.asciiSlice = function () {
  var bytes = Array.prototype.slice.apply(this, arguments);
  var ret = "";
  for (var i = 0; i < bytes.length; i++)
    ret += String.fromCharCode(bytes[i]);
  return ret;
}

SlowBuffer.prototype.inspect = function() {
  var out = [],
      len = this.length;
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i]);
    if (i == exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...';
      break;
    }
  }
  return '<SlowBuffer ' + out.join(' ') + '>';
};


SlowBuffer.prototype.hexSlice = function(start, end) {
  var len = this.length;

  if (!start || start < 0) start = 0;
  if (!end || end < 0 || end > len) end = len;

  var out = '';
  for (var i = start; i < end; i++) {
    out += toHex(this[i]);
  }
  return out;
};


SlowBuffer.prototype.toString = function(encoding, start, end) {
  encoding = String(encoding || 'utf8').toLowerCase();
  start = +start || 0;
  if (typeof end == 'undefined') end = this.length;

  // Fastpath empty strings
  if (+end == start) {
    return '';
  }

  switch (encoding) {
    case 'hex':
      return this.hexSlice(start, end);

    case 'utf8':
    case 'utf-8':
      return this.utf8Slice(start, end);

    case 'ascii':
      return this.asciiSlice(start, end);

    case 'binary':
      return this.binarySlice(start, end);

    case 'base64':
      return this.base64Slice(start, end);

    case 'ucs2':
    case 'ucs-2':
      return this.ucs2Slice(start, end);

    default:
      throw new Error('Unknown encoding');
  }
};


SlowBuffer.prototype.hexWrite = function(string, offset, length) {
  offset = +offset || 0;
  var remaining = this.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = +length;
    if (length > remaining) {
      length = remaining;
    }
  }

  // must be an even number of digits
  var strLen = string.length;
  if (strLen % 2) {
    throw new Error('Invalid hex string');
  }
  if (length > strLen / 2) {
    length = strLen / 2;
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16);
    if (isNaN(byte)) throw new Error('Invalid hex string');
    this[offset + i] = byte;
  }
  SlowBuffer._charsWritten = i * 2;
  return i;
};


SlowBuffer.prototype.write = function(string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length;
      length = undefined;
    }
  } else {  // legacy
    var swap = encoding;
    encoding = offset;
    offset = length;
    length = swap;
  }

  offset = +offset || 0;
  var remaining = this.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = +length;
    if (length > remaining) {
      length = remaining;
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase();

  switch (encoding) {
    case 'hex':
      return this.hexWrite(string, offset, length);

    case 'utf8':
    case 'utf-8':
      return this.utf8Write(string, offset, length);

    case 'ascii':
      return this.asciiWrite(string, offset, length);

    case 'binary':
      return this.binaryWrite(string, offset, length);

    case 'base64':
      return this.base64Write(string, offset, length);

    case 'ucs2':
    case 'ucs-2':
      return this.ucs2Write(string, offset, length);

    default:
      throw new Error('Unknown encoding');
  }
};


// slice(start, end)
SlowBuffer.prototype.slice = function(start, end) {
  if (end === undefined) end = this.length;

  if (end > this.length) {
    throw new Error('oob');
  }
  if (start > end) {
    throw new Error('oob');
  }

  return new Buffer(this, end - start, +start);
};

SlowBuffer.prototype.copy = function(target, targetstart, sourcestart, sourceend) {
  var temp = [];
  for (var i=sourcestart; i<sourceend; i++) {
    assert.ok(typeof this[i] !== 'undefined', "copying undefined buffer bytes!");
    temp.push(this[i]);
  }

  for (var i=targetstart; i<targetstart+temp.length; i++) {
    target[i] = temp[i-targetstart];
  }
};

function coerce(length) {
  // Coerce length to a number (possibly NaN), round up
  // in case it's fractional (e.g. 123.456) then do a
  // double negate to coerce a NaN to 0. Easy, right?
  length = ~~Math.ceil(+length);
  return length < 0 ? 0 : length;
}


// Buffer

function Buffer(subject, encoding, offset) {
  if (!(this instanceof Buffer)) {
    return new Buffer(subject, encoding, offset);
  }

  var type;

  // Are we slicing?
  if (typeof offset === 'number') {
    this.length = coerce(encoding);
    this.parent = subject;
    this.offset = offset;
  } else {
    // Find the length
    switch (type = typeof subject) {
      case 'number':
        this.length = coerce(subject);
        break;

      case 'string':
        this.length = Buffer.byteLength(subject, encoding);
        break;

      case 'object': // Assume object is an array
        this.length = coerce(subject.length);
        break;

      default:
        throw new Error('First argument needs to be a number, ' +
                        'array or string.');
    }

    if (this.length > Buffer.poolSize) {
      // Big buffer, just alloc one.
      this.parent = new SlowBuffer(this.length);
      this.offset = 0;

    } else {
      // Small buffer.
      if (!pool || pool.length - pool.used < this.length) allocPool();
      this.parent = pool;
      this.offset = pool.used;
      pool.used += this.length;
    }

    // Treat array-ish objects as a byte array.
    if (isArrayIsh(subject)) {
      for (var i = 0; i < this.length; i++) {
        this.parent[i + this.offset] = subject[i];
      }
    } else if (type == 'string') {
      // We are a string
      this.length = this.write(subject, 0, encoding);
    }
  }

}

function isArrayIsh(subject) {
  return Array.isArray(subject) || Buffer.isBuffer(subject) ||
         subject && typeof subject === 'object' &&
         typeof subject.length === 'number';
}

exports.SlowBuffer = SlowBuffer;
exports.Buffer = Buffer;

Buffer.poolSize = 8 * 1024;
var pool;

function allocPool() {
  pool = new SlowBuffer(Buffer.poolSize);
  pool.used = 0;
}


// Static methods
Buffer.isBuffer = function isBuffer(b) {
  return b instanceof Buffer || b instanceof SlowBuffer;
};

Buffer.concat = function (list, totalLength) {
  if (!Array.isArray(list)) {
    throw new Error("Usage: Buffer.concat(list, [totalLength])\n \
      list should be an Array.");
  }

  if (list.length === 0) {
    return new Buffer(0);
  } else if (list.length === 1) {
    return list[0];
  }

  if (typeof totalLength !== 'number') {
    totalLength = 0;
    for (var i = 0; i < list.length; i++) {
      var buf = list[i];
      totalLength += buf.length;
    }
  }

  var buffer = new Buffer(totalLength);
  var pos = 0;
  for (var i = 0; i < list.length; i++) {
    var buf = list[i];
    buf.copy(buffer, pos);
    pos += buf.length;
  }
  return buffer;
};

// Inspect
Buffer.prototype.inspect = function inspect() {
  var out = [],
      len = this.length;

  for (var i = 0; i < len; i++) {
    out[i] = toHex(this.parent[i + this.offset]);
    if (i == exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...';
      break;
    }
  }

  return '<Buffer ' + out.join(' ') + '>';
};


Buffer.prototype.get = function get(i) {
  if (i < 0 || i >= this.length) throw new Error('oob');
  return this.parent[this.offset + i];
};


Buffer.prototype.set = function set(i, v) {
  if (i < 0 || i >= this.length) throw new Error('oob');
  return this.parent[this.offset + i] = v;
};


// write(string, offset = 0, length = buffer.length-offset, encoding = 'utf8')
Buffer.prototype.write = function(string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length;
      length = undefined;
    }
  } else {  // legacy
    var swap = encoding;
    encoding = offset;
    offset = length;
    length = swap;
  }

  offset = +offset || 0;
  var remaining = this.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = +length;
    if (length > remaining) {
      length = remaining;
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase();

  var ret;
  switch (encoding) {
    case 'hex':
      ret = this.parent.hexWrite(string, this.offset + offset, length);
      break;

    case 'utf8':
    case 'utf-8':
      ret = this.parent.utf8Write(string, this.offset + offset, length);
      break;

    case 'ascii':
      ret = this.parent.asciiWrite(string, this.offset + offset, length);
      break;

    case 'binary':
      ret = this.parent.binaryWrite(string, this.offset + offset, length);
      break;

    case 'base64':
      // Warning: maxLength not taken into account in base64Write
      ret = this.parent.base64Write(string, this.offset + offset, length);
      break;

    case 'ucs2':
    case 'ucs-2':
      ret = this.parent.ucs2Write(string, this.offset + offset, length);
      break;

    default:
      throw new Error('Unknown encoding');
  }

  Buffer._charsWritten = SlowBuffer._charsWritten;

  return ret;
};


// toString(encoding, start=0, end=buffer.length)
Buffer.prototype.toString = function(encoding, start, end) {
  encoding = String(encoding || 'utf8').toLowerCase();

  if (typeof start == 'undefined' || start < 0) {
    start = 0;
  } else if (start > this.length) {
    start = this.length;
  }

  if (typeof end == 'undefined' || end > this.length) {
    end = this.length;
  } else if (end < 0) {
    end = 0;
  }

  start = start + this.offset;
  end = end + this.offset;

  switch (encoding) {
    case 'hex':
      return this.parent.hexSlice(start, end);

    case 'utf8':
    case 'utf-8':
      return this.parent.utf8Slice(start, end);

    case 'ascii':
      return this.parent.asciiSlice(start, end);

    case 'binary':
      return this.parent.binarySlice(start, end);

    case 'base64':
      return this.parent.base64Slice(start, end);

    case 'ucs2':
    case 'ucs-2':
      return this.parent.ucs2Slice(start, end);

    default:
      throw new Error('Unknown encoding');
  }
};


// byteLength
Buffer.byteLength = SlowBuffer.byteLength;


// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill(value, start, end) {
  value || (value = 0);
  start || (start = 0);
  end || (end = this.length);

  if (typeof value === 'string') {
    value = value.charCodeAt(0);
  }
  if (!(typeof value === 'number') || isNaN(value)) {
    throw new Error('value is not a number');
  }

  if (end < start) throw new Error('end < start');

  // Fill 0 bytes; we're done
  if (end === start) return 0;
  if (this.length == 0) return 0;

  if (start < 0 || start >= this.length) {
    throw new Error('start out of bounds');
  }

  if (end < 0 || end > this.length) {
    throw new Error('end out of bounds');
  }

  return this.parent.fill(value,
                          start + this.offset,
                          end + this.offset);
};


// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function(target, target_start, start, end) {
  var source = this;
  start || (start = 0);
  end || (end = this.length);
  target_start || (target_start = 0);

  if (end < start) throw new Error('sourceEnd < sourceStart');

  // Copy 0 bytes; we're done
  if (end === start) return 0;
  if (target.length == 0 || source.length == 0) return 0;

  if (target_start < 0 || target_start >= target.length) {
    throw new Error('targetStart out of bounds');
  }

  if (start < 0 || start >= source.length) {
    throw new Error('sourceStart out of bounds');
  }

  if (end < 0 || end > source.length) {
    throw new Error('sourceEnd out of bounds');
  }

  // Are we oob?
  if (end > this.length) {
    end = this.length;
  }

  if (target.length - target_start < end - start) {
    end = target.length - target_start + start;
  }

  return this.parent.copy(target.parent,
                          target_start + target.offset,
                          start + this.offset,
                          end + this.offset);
};


// slice(start, end)
Buffer.prototype.slice = function(start, end) {
  if (end === undefined) end = this.length;
  if (end > this.length) throw new Error('oob');
  if (start > end) throw new Error('oob');

  return new Buffer(this.parent, end - start, +start + this.offset);
};


// Legacy methods for backwards compatibility.

Buffer.prototype.utf8Slice = function(start, end) {
  return this.toString('utf8', start, end);
};

Buffer.prototype.binarySlice = function(start, end) {
  return this.toString('binary', start, end);
};

Buffer.prototype.asciiSlice = function(start, end) {
  return this.toString('ascii', start, end);
};

Buffer.prototype.utf8Write = function(string, offset) {
  return this.write(string, offset, 'utf8');
};

Buffer.prototype.binaryWrite = function(string, offset) {
  return this.write(string, offset, 'binary');
};

Buffer.prototype.asciiWrite = function(string, offset) {
  return this.write(string, offset, 'ascii');
};

Buffer.prototype.readUInt8 = function(offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to read beyond buffer length');
  }

  return buffer.parent[buffer.offset + offset];
};

function readUInt16(buffer, offset, isBigEndian, noAssert) {
  var val = 0;


  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (isBigEndian) {
    val = buffer.parent[buffer.offset + offset] << 8;
    val |= buffer.parent[buffer.offset + offset + 1];
  } else {
    val = buffer.parent[buffer.offset + offset];
    val |= buffer.parent[buffer.offset + offset + 1] << 8;
  }

  return val;
}

Buffer.prototype.readUInt16LE = function(offset, noAssert) {
  return readUInt16(this, offset, false, noAssert);
};

Buffer.prototype.readUInt16BE = function(offset, noAssert) {
  return readUInt16(this, offset, true, noAssert);
};

function readUInt32(buffer, offset, isBigEndian, noAssert) {
  var val = 0;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (isBigEndian) {
    val = buffer.parent[buffer.offset + offset + 1] << 16;
    val |= buffer.parent[buffer.offset + offset + 2] << 8;
    val |= buffer.parent[buffer.offset + offset + 3];
    val = val + (buffer.parent[buffer.offset + offset] << 24 >>> 0);
  } else {
    val = buffer.parent[buffer.offset + offset + 2] << 16;
    val |= buffer.parent[buffer.offset + offset + 1] << 8;
    val |= buffer.parent[buffer.offset + offset];
    val = val + (buffer.parent[buffer.offset + offset + 3] << 24 >>> 0);
  }

  return val;
}

Buffer.prototype.readUInt32LE = function(offset, noAssert) {
  return readUInt32(this, offset, false, noAssert);
};

Buffer.prototype.readUInt32BE = function(offset, noAssert) {
  return readUInt32(this, offset, true, noAssert);
};


/*
 * Signed integer types, yay team! A reminder on how two's complement actually
 * works. The first bit is the signed bit, i.e. tells us whether or not the
 * number should be positive or negative. If the two's complement value is
 * positive, then we're done, as it's equivalent to the unsigned representation.
 *
 * Now if the number is positive, you're pretty much done, you can just leverage
 * the unsigned translations and return those. Unfortunately, negative numbers
 * aren't quite that straightforward.
 *
 * At first glance, one might be inclined to use the traditional formula to
 * translate binary numbers between the positive and negative values in two's
 * complement. (Though it doesn't quite work for the most negative value)
 * Mainly:
 *  - invert all the bits
 *  - add one to the result
 *
 * Of course, this doesn't quite work in Javascript. Take for example the value
 * of -128. This could be represented in 16 bits (big-endian) as 0xff80. But of
 * course, Javascript will do the following:
 *
 * > ~0xff80
 * -65409
 *
 * Whoh there, Javascript, that's not quite right. But wait, according to
 * Javascript that's perfectly correct. When Javascript ends up seeing the
 * constant 0xff80, it has no notion that it is actually a signed number. It
 * assumes that we've input the unsigned value 0xff80. Thus, when it does the
 * binary negation, it casts it into a signed value, (positive 0xff80). Then
 * when you perform binary negation on that, it turns it into a negative number.
 *
 * Instead, we're going to have to use the following general formula, that works
 * in a rather Javascript friendly way. I'm glad we don't support this kind of
 * weird numbering scheme in the kernel.
 *
 * (BIT-MAX - (unsigned)val + 1) * -1
 *
 * The astute observer, may think that this doesn't make sense for 8-bit numbers
 * (really it isn't necessary for them). However, when you get 16-bit numbers,
 * you do. Let's go back to our prior example and see how this will look:
 *
 * (0xffff - 0xff80 + 1) * -1
 * (0x007f + 1) * -1
 * (0x0080) * -1
 */
Buffer.prototype.readInt8 = function(offset, noAssert) {
  var buffer = this;
  var neg;

  if (!noAssert) {
    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to read beyond buffer length');
  }

  neg = buffer.parent[buffer.offset + offset] & 0x80;
  if (!neg) {
    return (buffer.parent[buffer.offset + offset]);
  }

  return ((0xff - buffer.parent[buffer.offset + offset] + 1) * -1);
};

function readInt16(buffer, offset, isBigEndian, noAssert) {
  var neg, val;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to read beyond buffer length');
  }

  val = readUInt16(buffer, offset, isBigEndian, noAssert);
  neg = val & 0x8000;
  if (!neg) {
    return val;
  }

  return (0xffff - val + 1) * -1;
}

Buffer.prototype.readInt16LE = function(offset, noAssert) {
  return readInt16(this, offset, false, noAssert);
};

Buffer.prototype.readInt16BE = function(offset, noAssert) {
  return readInt16(this, offset, true, noAssert);
};

function readInt32(buffer, offset, isBigEndian, noAssert) {
  var neg, val;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  val = readUInt32(buffer, offset, isBigEndian, noAssert);
  neg = val & 0x80000000;
  if (!neg) {
    return (val);
  }

  return (0xffffffff - val + 1) * -1;
}

Buffer.prototype.readInt32LE = function(offset, noAssert) {
  return readInt32(this, offset, false, noAssert);
};

Buffer.prototype.readInt32BE = function(offset, noAssert) {
  return readInt32(this, offset, true, noAssert);
};

function readFloat(buffer, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  return require('./buffer_ieee754').readIEEE754(buffer, offset, isBigEndian,
      23, 4);
}

Buffer.prototype.readFloatLE = function(offset, noAssert) {
  return readFloat(this, offset, false, noAssert);
};

Buffer.prototype.readFloatBE = function(offset, noAssert) {
  return readFloat(this, offset, true, noAssert);
};

function readDouble(buffer, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset + 7 < buffer.length,
        'Trying to read beyond buffer length');
  }

  return require('./buffer_ieee754').readIEEE754(buffer, offset, isBigEndian,
      52, 8);
}

Buffer.prototype.readDoubleLE = function(offset, noAssert) {
  return readDouble(this, offset, false, noAssert);
};

Buffer.prototype.readDoubleBE = function(offset, noAssert) {
  return readDouble(this, offset, true, noAssert);
};


/*
 * We have to make sure that the value is a valid integer. This means that it is
 * non-negative. It has no fractional component and that it does not exceed the
 * maximum allowed value.
 *
 *      value           The number to check for validity
 *
 *      max             The maximum value
 */
function verifuint(value, max) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value >= 0,
      'specified a negative value for writing an unsigned value');

  assert.ok(value <= max, 'value is larger than maximum value for type');

  assert.ok(Math.floor(value) === value, 'value has a fractional component');
}

Buffer.prototype.writeUInt8 = function(value, offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xff);
  }

  buffer.parent[buffer.offset + offset] = value;
};

function writeUInt16(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xffff);
  }

  if (isBigEndian) {
    buffer.parent[buffer.offset + offset] = (value & 0xff00) >>> 8;
    buffer.parent[buffer.offset + offset + 1] = value & 0x00ff;
  } else {
    buffer.parent[buffer.offset + offset + 1] = (value & 0xff00) >>> 8;
    buffer.parent[buffer.offset + offset] = value & 0x00ff;
  }
}

Buffer.prototype.writeUInt16LE = function(value, offset, noAssert) {
  writeUInt16(this, value, offset, false, noAssert);
};

Buffer.prototype.writeUInt16BE = function(value, offset, noAssert) {
  writeUInt16(this, value, offset, true, noAssert);
};

function writeUInt32(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xffffffff);
  }

  if (isBigEndian) {
    buffer.parent[buffer.offset + offset] = (value >>> 24) & 0xff;
    buffer.parent[buffer.offset + offset + 1] = (value >>> 16) & 0xff;
    buffer.parent[buffer.offset + offset + 2] = (value >>> 8) & 0xff;
    buffer.parent[buffer.offset + offset + 3] = value & 0xff;
  } else {
    buffer.parent[buffer.offset + offset + 3] = (value >>> 24) & 0xff;
    buffer.parent[buffer.offset + offset + 2] = (value >>> 16) & 0xff;
    buffer.parent[buffer.offset + offset + 1] = (value >>> 8) & 0xff;
    buffer.parent[buffer.offset + offset] = value & 0xff;
  }
}

Buffer.prototype.writeUInt32LE = function(value, offset, noAssert) {
  writeUInt32(this, value, offset, false, noAssert);
};

Buffer.prototype.writeUInt32BE = function(value, offset, noAssert) {
  writeUInt32(this, value, offset, true, noAssert);
};


/*
 * We now move onto our friends in the signed number category. Unlike unsigned
 * numbers, we're going to have to worry a bit more about how we put values into
 * arrays. Since we are only worrying about signed 32-bit values, we're in
 * slightly better shape. Unfortunately, we really can't do our favorite binary
 * & in this system. It really seems to do the wrong thing. For example:
 *
 * > -32 & 0xff
 * 224
 *
 * What's happening above is really: 0xe0 & 0xff = 0xe0. However, the results of
 * this aren't treated as a signed number. Ultimately a bad thing.
 *
 * What we're going to want to do is basically create the unsigned equivalent of
 * our representation and pass that off to the wuint* functions. To do that
 * we're going to do the following:
 *
 *  - if the value is positive
 *      we can pass it directly off to the equivalent wuint
 *  - if the value is negative
 *      we do the following computation:
 *         mb + val + 1, where
 *         mb   is the maximum unsigned value in that byte size
 *         val  is the Javascript negative integer
 *
 *
 * As a concrete value, take -128. In signed 16 bits this would be 0xff80. If
 * you do out the computations:
 *
 * 0xffff - 128 + 1
 * 0xffff - 127
 * 0xff80
 *
 * You can then encode this value as the signed version. This is really rather
 * hacky, but it should work and get the job done which is our goal here.
 */

/*
 * A series of checks to make sure we actually have a signed 32-bit number
 */
function verifsint(value, max, min) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value <= max, 'value larger than maximum allowed value');

  assert.ok(value >= min, 'value smaller than minimum allowed value');

  assert.ok(Math.floor(value) === value, 'value has a fractional component');
}

function verifIEEE754(value, max, min) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value <= max, 'value larger than maximum allowed value');

  assert.ok(value >= min, 'value smaller than minimum allowed value');
}

Buffer.prototype.writeInt8 = function(value, offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7f, -0x80);
  }

  if (value >= 0) {
    buffer.writeUInt8(value, offset, noAssert);
  } else {
    buffer.writeUInt8(0xff + value + 1, offset, noAssert);
  }
};

function writeInt16(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7fff, -0x8000);
  }

  if (value >= 0) {
    writeUInt16(buffer, value, offset, isBigEndian, noAssert);
  } else {
    writeUInt16(buffer, 0xffff + value + 1, offset, isBigEndian, noAssert);
  }
}

Buffer.prototype.writeInt16LE = function(value, offset, noAssert) {
  writeInt16(this, value, offset, false, noAssert);
};

Buffer.prototype.writeInt16BE = function(value, offset, noAssert) {
  writeInt16(this, value, offset, true, noAssert);
};

function writeInt32(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7fffffff, -0x80000000);
  }

  if (value >= 0) {
    writeUInt32(buffer, value, offset, isBigEndian, noAssert);
  } else {
    writeUInt32(buffer, 0xffffffff + value + 1, offset, isBigEndian, noAssert);
  }
}

Buffer.prototype.writeInt32LE = function(value, offset, noAssert) {
  writeInt32(this, value, offset, false, noAssert);
};

Buffer.prototype.writeInt32BE = function(value, offset, noAssert) {
  writeInt32(this, value, offset, true, noAssert);
};

function writeFloat(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to write beyond buffer length');

    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38);
  }

  require('./buffer_ieee754').writeIEEE754(buffer, value, offset, isBigEndian,
      23, 4);
}

Buffer.prototype.writeFloatLE = function(value, offset, noAssert) {
  writeFloat(this, value, offset, false, noAssert);
};

Buffer.prototype.writeFloatBE = function(value, offset, noAssert) {
  writeFloat(this, value, offset, true, noAssert);
};

function writeDouble(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 7 < buffer.length,
        'Trying to write beyond buffer length');

    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308);
  }

  require('./buffer_ieee754').writeIEEE754(buffer, value, offset, isBigEndian,
      52, 8);
}

Buffer.prototype.writeDoubleLE = function(value, offset, noAssert) {
  writeDouble(this, value, offset, false, noAssert);
};

Buffer.prototype.writeDoubleBE = function(value, offset, noAssert) {
  writeDouble(this, value, offset, true, noAssert);
};

SlowBuffer.prototype.readUInt8 = Buffer.prototype.readUInt8;
SlowBuffer.prototype.readUInt16LE = Buffer.prototype.readUInt16LE;
SlowBuffer.prototype.readUInt16BE = Buffer.prototype.readUInt16BE;
SlowBuffer.prototype.readUInt32LE = Buffer.prototype.readUInt32LE;
SlowBuffer.prototype.readUInt32BE = Buffer.prototype.readUInt32BE;
SlowBuffer.prototype.readInt8 = Buffer.prototype.readInt8;
SlowBuffer.prototype.readInt16LE = Buffer.prototype.readInt16LE;
SlowBuffer.prototype.readInt16BE = Buffer.prototype.readInt16BE;
SlowBuffer.prototype.readInt32LE = Buffer.prototype.readInt32LE;
SlowBuffer.prototype.readInt32BE = Buffer.prototype.readInt32BE;
SlowBuffer.prototype.readFloatLE = Buffer.prototype.readFloatLE;
SlowBuffer.prototype.readFloatBE = Buffer.prototype.readFloatBE;
SlowBuffer.prototype.readDoubleLE = Buffer.prototype.readDoubleLE;
SlowBuffer.prototype.readDoubleBE = Buffer.prototype.readDoubleBE;
SlowBuffer.prototype.writeUInt8 = Buffer.prototype.writeUInt8;
SlowBuffer.prototype.writeUInt16LE = Buffer.prototype.writeUInt16LE;
SlowBuffer.prototype.writeUInt16BE = Buffer.prototype.writeUInt16BE;
SlowBuffer.prototype.writeUInt32LE = Buffer.prototype.writeUInt32LE;
SlowBuffer.prototype.writeUInt32BE = Buffer.prototype.writeUInt32BE;
SlowBuffer.prototype.writeInt8 = Buffer.prototype.writeInt8;
SlowBuffer.prototype.writeInt16LE = Buffer.prototype.writeInt16LE;
SlowBuffer.prototype.writeInt16BE = Buffer.prototype.writeInt16BE;
SlowBuffer.prototype.writeInt32LE = Buffer.prototype.writeInt32LE;
SlowBuffer.prototype.writeInt32BE = Buffer.prototype.writeInt32BE;
SlowBuffer.prototype.writeFloatLE = Buffer.prototype.writeFloatLE;
SlowBuffer.prototype.writeFloatBE = Buffer.prototype.writeFloatBE;
SlowBuffer.prototype.writeDoubleLE = Buffer.prototype.writeDoubleLE;
SlowBuffer.prototype.writeDoubleBE = Buffer.prototype.writeDoubleBE;

},{"assert":1,"./buffer_ieee754":8,"base64-js":9}],9:[function(require,module,exports){
(function (exports) {
	'use strict';

	var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	function b64ToByteArray(b64) {
		var i, j, l, tmp, placeHolders, arr;
	
		if (b64.length % 4 > 0) {
			throw 'Invalid string. Length must be a multiple of 4';
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		placeHolders = b64.indexOf('=');
		placeHolders = placeHolders > 0 ? b64.length - placeHolders : 0;

		// base64 is 4/3 + up to two characters of the original data
		arr = [];//new Uint8Array(b64.length * 3 / 4 - placeHolders);

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length;

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (lookup.indexOf(b64[i]) << 18) | (lookup.indexOf(b64[i + 1]) << 12) | (lookup.indexOf(b64[i + 2]) << 6) | lookup.indexOf(b64[i + 3]);
			arr.push((tmp & 0xFF0000) >> 16);
			arr.push((tmp & 0xFF00) >> 8);
			arr.push(tmp & 0xFF);
		}

		if (placeHolders === 2) {
			tmp = (lookup.indexOf(b64[i]) << 2) | (lookup.indexOf(b64[i + 1]) >> 4);
			arr.push(tmp & 0xFF);
		} else if (placeHolders === 1) {
			tmp = (lookup.indexOf(b64[i]) << 10) | (lookup.indexOf(b64[i + 1]) << 4) | (lookup.indexOf(b64[i + 2]) >> 2);
			arr.push((tmp >> 8) & 0xFF);
			arr.push(tmp & 0xFF);
		}

		return arr;
	}

	function uint8ToBase64(uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length;

		function tripletToBase64 (num) {
			return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
		};

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
			output += tripletToBase64(temp);
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1];
				output += lookup[temp >> 2];
				output += lookup[(temp << 4) & 0x3F];
				output += '==';
				break;
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1]);
				output += lookup[temp >> 10];
				output += lookup[(temp >> 4) & 0x3F];
				output += lookup[(temp << 2) & 0x3F];
				output += '=';
				break;
		}

		return output;
	}

	module.exports.toByteArray = b64ToByteArray;
	module.exports.fromByteArray = uint8ToBase64;
}());

},{}]},{},[])
;;module.exports=require("buffer-browserify")

},{}],20:[function(require,module,exports){
var Struct = require('structjs')

var Entry = module.exports = new Struct({
  tag:      Struct.String(4),
  checkSum: Struct.Uint32,
  offset:   Struct.Uint32,
  length:   Struct.Uint32
})

var Directory = module.exports = new Struct({
  scalerType:    Struct.Int32,
  numTables:     Struct.Uint16,
  searchRange:   Struct.Uint16.with({
    $packing: function() {
      var searchRange, next = 1
      while ((next = next * 2) <= this.numTables) {
        searchRange = next
      }
      return searchRange * 16
    }
  }),
  entrySelector: Struct.Uint16.with({
    $packing: function() {
      return Math.log(this.searchRange / 16) / Math.LN2
    }
  }),
  rangeShift:    Struct.Uint16.with({
    $packing: function() {
      return this.numTables * 16 - this.searchRange
    }
  }),
  entries:       Struct.Hash(Entry, 'tag', Struct.Ref('numTables'))
})
},{"structjs":33}],21:[function(require,module,exports){
var Subset = module.exports = function(font) {
  this.font    = font
  this.subset  = { '32': 32 }
  this.mapping = { '32': 32 }
  this.pos     = 33
}

Subset.prototype.use = function(chars) {
  for (var i = 0, len = chars.length; i < len; ++i) {
    var code = chars.charCodeAt(i)
    if (code in this.mapping || code < 33) continue
    this.subset[this.pos] = code
    this.mapping[code] = this.pos++
  }
}

Subset.prototype.encode = function(str) {
  var codes = []
  for (var i = 0, len = str.length; i < len; ++i) {
    codes.push(this.mapping[str.charCodeAt(i)])
  }
  return String.fromCharCode.apply(String, codes)
}

Subset.prototype.cmap = function() {
  var mapping = {}
  for (code in this.subset) {
    var value = this.font.codeMap[this.subset[code]]
    if (value !== undefined) mapping[code] = value
  }
  return mapping
}

Subset.prototype.glyphs = function() {
  // collect used glyph ids
  var self = this, ids = [0]
  for (var pos in this.subset) {
    var code = this.subset[pos]
      , val = this.font.codeMap[code]
    if (val !== undefined && !!!~ids.indexOf(val))
      ids.push(val)
  }
  ids.sort()
  
  // collect the actual glyphs
  function collect(ids) {
    var glyphs = {}
    ids.forEach(function(id) {
      var glyph = self.font.tables.glyf.for(id)
      glyphs[id] = glyph
      if (glyph !== null ? glyph.isCompound : false) {
        var compounds = collect(glyph.ids)
        for (id in compounds) {
          glyphs[id] =  compounds[id]
        }
      }
    })
    return glyphs
  }
  
  return collect(ids)
}

Subset.prototype.embed = function() {
  var cmap   = this.font.tables.cmap.embed(this.cmap())
    , glyphs = this.glyphs()
    
  this.font.tables.cmap.subtables = [cmap.subtable]
  
  var old2new = { 0: 0 }
  for (var code in cmap.charMap) {
    var ids = cmap.charMap[code]
    old2new[ids.old] = ids.new
  }
  
  var nextGlyphID = cmap.maxGlyphID
  for (var oldID in glyphs) {
    if (!(oldID in old2new))
      old2new[oldID] = nextGlyphID++
  }
  
  var new2old = {}
  for (var id in old2new) {
    new2old[old2new[id]] = id
  }
  var newIDs = Object.keys(new2old).sort(function(a, b) {
    return a - b
  })
  var oldIDs = newIDs.map(function(id) {
    return new2old[id]
  })
  
  // encode the font tables
  var offsets = this.font.tables.glyf.embed(glyphs, oldIDs, old2new)
  this.font.tables.loca.embed(offsets)
  this.font.tables.hmtx.embed(oldIDs)
  this.font.tables.hhea.embed(oldIDs)
  this.font.tables.maxp.embed(oldIDs)
  this.font.tables.name.embed(cmap.charMap)
}
},{}],22:[function(require,module,exports){
var Struct = require('structjs')

var Table = new Struct({
  format:        Struct.Uint16
}, { storage: true, offset: Struct.Ref('offset') })

Table.conditional(function() { return this.format === 4 }, {
  length:          Struct.Uint16,
  language:        Struct.Uint16,
  segCount:        Struct.Uint16.with({
    $unpacked: function(value) {
      return value / 2
    },
    $packing: function(value) {
      return value * 2
    }
  }),
  searchRange:     Struct.Uint16,
  entrySelector:   Struct.Uint16,
  rangeShift:      Struct.Uint16,
  endCode:         Struct.Array(Struct.Uint16, Struct.Ref('segCount')),
  reservedPad:     Struct.Uint16,
  startCode:       Struct.Array(Struct.Uint16, Struct.Ref('segCount')),
  idDelta:         Struct.Array(Struct.Uint16, Struct.Ref('segCount')),
  idRangeOffset:   Struct.Array(Struct.Uint16, Struct.Ref('segCount')),
  glyphIndexArray: Struct.Array(Struct.Uint16, function() {
    var length = (this.length - (8 + this.segCount * 4) * 2) / 2
    return length
  })
})

Table.prototype.$unpacked = function() {
  if (this.format !== 4) return
  this.codeMap = {}
  for (var i = 0, len = this.segCount; i < len; ++i) {
    var endCode = this.endCode[i], startCode = this.startCode[i]
      , idDelta = this.idDelta[i], idRangeOffset = this.idRangeOffset[i]
    
    for (var code = startCode; code <= endCode; ++code) {
      var id
      if (idRangeOffset === 0) id = code + idDelta
      else {
        var index = idRangeOffset / 2 + (code - startCode) - (this.segCount - i)
        id = this.glyphIndexArray[index] || 0 // because some TTF fonts are broken
        if (id != 0) id += idDelta
      }
      
      this.codeMap[code] = id & 0xFFFF
    }
  }
}

var SubTable = new Struct({
  platformID:         Struct.Uint16,
  platformSpecificID: Struct.Uint16,
  offset:             Struct.Uint32,
  format:             Struct.Uint16.from(Struct.Ref('offset')),
  table:              Table
})

Object.defineProperty(SubTable.prototype, 'isUnicode', {
  enumerable: true,
  get: function() {
           //this.format === 4 &&
    return ((this.platformID === 3 // Windows platform-specific encoding
             && this.platformSpecificID === 1) // http://www.microsoft.com/typography/otspec/name.htm
           || this.platformID === 0) // Unicode platform-specific encoding
  }
})

var Cmap = module.exports = new Struct({
  version:         Struct.Uint16,
  numberSubtables: Struct.Uint16,
  subtables:       Struct.Array(SubTable, Struct.Ref('numberSubtables')),
  tables:          Struct.Storage('subtables.table')
})

Cmap.prototype.embed = function(cmap) {
  var codes = Object.keys(cmap).sort(function(a, b) {
    return a - b
  })
  
  var nextId = 0, map = {}, charMap = {}, last = diff = null, endCodes = [], startCodes = []
  codes.forEach(function(code) {
    var old = cmap[code]
    if (map[old] === undefined) map[old] = ++nextId
    charMap[code] = { old: old, new: map[old] }
    var delta = map[old] - code
    if (last === null || delta !== diff) {
      if (last) endCodes.push(last)
      startCodes.push(code)
      diff = delta
    }
    last = code
  })
  
  if (last) endCodes.push(last)
  endCodes.push(0xFFFF)
  startCodes.push(0xFFFF)
  
  var segCount      = startCodes.length
    , segCountX2    = segCount * 2
    , searchRange   = 2 * Math.pow(Math.log(segCount) / Math.LN2, 2)
    , entrySelector = Math.log(searchRange / 2) / Math.LN2
    , rangeShift    = 2 * segCount - searchRange
  
  var deltas = []
    , rangeOffsets = []
    , glyphIDs = []
  
  for (var i = 0, len = startCodes.length; i < len; ++i) {
    var startCode = startCodes[i]
      , endCode = endCodes[i]
      
    if (startCode === 0xFFFF) {
      deltas.push(0)
      rangeOffsets.push(0)
      break
    }
    
    var startGlyph = charMap[startCode].new
    if (startCode - startGlyph >= 0x8000) {
      deltas.push(0)
      rangeOffsets.push(2 * (glyphIDs.length + segCount - i))
      
      for (var code = startCode; code < endCode; ++startCode) {
        glyphIDs.push(charMap[code].new)
      }
    } else {
      deltas.push(startGlyph - startCode)
      rangeOffsets.push(0)
    }
  }
  
  var subtable = new SubTable({
    platformID: 3,
    platformSpecificID: 1,
    offset: 12,
    table: new Table({
      format: 4,
      length: 16 + segCount * 8 + glyphIDs.length * 2,
      language: 0,
      segCount: segCount,
      searchRange: searchRange,
      entrySelector: entrySelector,
      rangeShift: rangeShift,
      endCode: endCodes,
      reservedPad: 0,
      startCode: startCodes,
      idDelta: deltas,
      idRangeOffset: rangeOffsets,
      glyphIndexArray: glyphIDs
    })
  })
      
  return {
    charMap: charMap,
    subtable: subtable,
    maxGlyphID: nextId + 1
  }
}
},{"structjs":33}],23:[function(require,module,exports){
var Struct = require('structjs')

module.exports = function(loca) {
  return new Glyf(loca)
}

var Glyf = function(loca) {
  this.loca  = loca
  this.cache = {}
}

Glyf.prototype.embed = function(glyphs, mapping, old2new) {
  var offsets = [], offset = 0
  this.mapping = mapping
  this.glyphs = glyphs
  mapping.forEach(function(id) {
    var glyph = glyphs[id]
    offsets.push(offset)
    if (!glyph) return
    glyph.embed(old2new)
    offset += glyph.lengthFor() * glyph.sizeFor()
  })
  offsets.push(offset)
  return offsets
}

Glyf.prototype.for = function(id) {
  if (id in this.cache) return this.cache[id]
  
  var index  = this.loca.indexOf(id)
    , length = this.loca.lengthOf(id)
    
  if (length === 0) return this.cache[id] = null
  return this.cache[id] = (new Glyph()).unpack(new DataView(this.view.buffer, this.view.byteOffset + index, length))
}

Glyf.prototype.unpack = function(view) {
  this.view = view
  return this
}

Glyf.prototype.pack = function(view, offset) {
  var self = this
  this.mapping.forEach(function(id) {
    var glyph = self.glyphs[id]
    if (!glyph) return
    glyph.pack(view, offset)
    offset += glyph.lengthFor() * glyph.sizeFor()
  })
}

Glyf.prototype.lengthFor = function() {
  return 1
}

Glyf.prototype.sizeFor = function() {
  var size = 0
  for (var id in this.cache) {
    var glyph = this.cache[id]
    if (!glyph) continue
    size += glyph.lengthFor() * glyph.sizeFor()
  }
  return size
}

var ARG_1_AND_2_ARE_WORDS    = 0x0001
  , WE_HAVE_A_SCALE          = 0x0008
  , MORE_COMPONENTS          = 0x0020
  , WE_HAVE_AN_X_AND_Y_SCALE = 0x0040
  , WE_HAVE_A_TWO_BY_TWO     = 0x0080
  , WE_HAVE_INSTRUCTIONS     = 0x0100

// Currently, it is all about being able to create font subsets.
// Therefore, it is not necessary to actually decompose the glyph
// into it's parts. Important are the locations within the provided
// buffer to be able to rewrite the glyph ids for subsets.
var Glyph = function() {
}

Glyph.prototype.unpack = function(view) {
  this.view = view
  this.isCompound = view.getInt16(0) === -1
  
  if (this.isCompound) {
    this.ids = []
    this.offsets = []
    var offset = 10

    // thanks to https://github.com/prawnpdf/ttfunk
    while(true) {
      var flags = this.view.getInt16(offset)
        , id    = this.view.getInt16(offset + 2)
      this.ids.push(id)
      this.offsets.push(offset + 2)
      
      if (!(flags & MORE_COMPONENTS)) break
      
      offset += 4
      
      if (flags & ARG_1_AND_2_ARE_WORDS) offset += 4
      else                               offset += 2
      
      if (flags & WE_HAVE_A_TWO_BY_TWO)          offset += 8
      else if (flags & WE_HAVE_AN_X_AND_Y_SCALE) offset += 4
      else if (flags & WE_HAVE_A_SCALE)          offset += 2
    }
  }
  
  return this
}

Glyph.prototype.pack = function(view, offset) {
  for (var i = 0, len = this.view.byteLength; i < len; ++i) {
    view.setUint8(offset + i, this.view.getUint8(i))
  }
}

Glyph.prototype.lengthFor = function() {
  return 1
}

Glyph.prototype.sizeFor = function() {
  return this.view.byteLength
}

Glyph.prototype.embed = function(mapping) {
  if (!this.isCompound) return
  var self = this
  this.ids.forEach(function(id, i) {
    self.view.setUint16(self.offsets[i], mapping[id])
  })
}
},{"structjs":33}],24:[function(require,module,exports){
var Struct = require('structjs')
module.exports = new Struct({
  version:            Struct.Int32,
  fontRevision:       Struct.Int32,
  checkSumAdjustment: Struct.Uint32,
  magicNumber:        Struct.Uint32,
  flags:              Struct.Uint16,
  unitsPerEm:         Struct.Uint16,
  createdA:           Struct.Int32,
  createdB:           Struct.Int32,
  modifiedA:          Struct.Int32,
  modifiedB:          Struct.Int32,
  xMin:               Struct.Int16,
  yMin:               Struct.Int16,
  xMax:               Struct.Int16,
  yMax:               Struct.Int16,
  macStyle:           Struct.Uint16,
  lowestRecPPEM:      Struct.Uint16,
  fontDirectionHint:  Struct.Int16,
  indexToLocFormat:   Struct.Int16,
  glyphDataFormat:    Struct.Int16
})
},{"structjs":33}],25:[function(require,module,exports){
var Struct = require('structjs')

var Hhea = module.exports = new Struct({
  version:             Struct.Int32,
  ascent:              Struct.Int16,
  descent:             Struct.Int16,
  lineGap:             Struct.Int16,
  advanceWidthMax:     Struct.Uint16,
  minLeftSideBearing:  Struct.Int16,
  minRightSideBearing: Struct.Int16,
  xMaxExtent:          Struct.Int16,
  caretSlopeRise:      Struct.Int16,
  caretSlopeRun:       Struct.Int16,
  caretOffset:         Struct.Int16,
  reserved1:           Struct.Int16,
  reserved2:           Struct.Int16,
  reserved3:           Struct.Int16,
  reserved4:           Struct.Int16,
  metricDataFormat:    Struct.Int16,
  numOfLongHorMetrics: Struct.Uint16
})

Hhea.prototype.embed = function(ids) {
  this.numOfLongHorMetrics = ids.length
}
},{"structjs":33}],26:[function(require,module,exports){
var Struct = require('structjs')

var AdvanceWidth = new Struct({
  advanceWidth:    Struct.Uint16,
  leftSideBearing: Struct.Int16
})

module.exports = function(numOfLongHorMetrics, numGlyphs) {
  var Hmtx = new Struct({
    hMetrics:        Struct.Array(AdvanceWidth, numOfLongHorMetrics),
    leftSideBearing: Struct.Array(Struct.Uint16, numGlyphs - numOfLongHorMetrics)
  })
  
  Hmtx.prototype.$unpacked = function() {
    var metrics = this.metrics = []
    this.hMetrics.forEach(function(e) {
      metrics.push(e.advanceWidth)
    })
    var last = metrics[metrics.length - 1]
    this.leftSideBearing.forEach(function(mapping) {
      metrics.push(last)
    })
  }
  
  Hmtx.prototype.for = function(id) {
    if (id in this.hMetrics) return this.hMetrics[id]
    
    return new AdvanceWidth({
      advanceWidth:    this.hMetrics[this.hMetrics.length - 1].advance,
      leftSideBearing: this.leftSideBearing[id - this.hMetrics.length]
    })
  }
  
  Hmtx.prototype.embed = function(ids) {
    var self = this, metrics = []
    ids.forEach(function(id) {
      metrics.push(self.for(id))
    })
    
    this.hMetrics = metrics
    this.leftSideBearing = []
    
    this._definition.hMetrics._length = ids.length
    this._definition.leftSideBearing._length = 0
  }
  
  return Hmtx
}


},{"structjs":33}],27:[function(require,module,exports){
var Struct = require('structjs')
module.exports = function(indexToLocFormat, numGlyphs) {
  var Loca
  switch (indexToLocFormat) {
    case 0:
      Loca = new Struct({
        offsets: Struct.Array(Struct.Uint16, numGlyphs + 1)
      })
      Loca.prototype.$unpacked = function() {
        for (var i = 0, len = this.offsets.length; i < len; ++i) {
          this.offsets[i] *= 2
        }
      }
      Loca.prototype.$packing = function() {
        for (var i = 0, len = this.offsets.length; i < len; ++i) {
          this.offsets[i] /= 2
        }
      }
      break
    case 1:
      Loca = new Struct({
        offsets: Struct.Array(Struct.Uint32, numGlyphs + 1)
      })
      break
  }
  
  Loca.prototype.indexOf = function(id) {
    return this.offsets[id]
  }

  Loca.prototype.lengthOf = function(id) {
    return this.offsets[id + 1] - this.offsets[id]
  }
  
  Loca.prototype.embed = function(offsets) {
    this._definition.offsets._length = offsets.length
    this.offsets = offsets
  }
  
  return Loca
}
},{"structjs":33}],28:[function(require,module,exports){
var Struct = require('structjs')

var Maxp = module.exports = new Struct({
  version:               Struct.Int32,
  numGlyphs:             Struct.Uint16,
  maxPoints:             Struct.Uint16,
  maxContours:           Struct.Uint16,
  maxComponentPoints:    Struct.Uint16,
  maxComponentContours:  Struct.Uint16,
  maxZones:              Struct.Uint16,
  maxTwilightPoints:     Struct.Uint16,
  maxStorage:            Struct.Uint16,
  maxFunctionDefs:       Struct.Uint16,
  maxInstructionDefs:    Struct.Uint16,
  maxStackElements:      Struct.Uint16,
  maxSizeOfInstructions: Struct.Uint16,
  maxComponentElements:  Struct.Uint16,
  maxComponentDepth:     Struct.Uint16
})

Maxp.prototype.embed = function(ids) {
  this.numGlyphs = ids.length
}
},{"structjs":33}],29:[function(require,module,exports){
var Struct = require('structjs')

var Record = new Struct({
  platformID: Struct.Uint16,
  encodingID: Struct.Uint16,
  languageID: Struct.Uint16,
  nameID:     Struct.Uint16,
  length:     Struct.Uint16.with({
    $unpacked: function(value) {
      return value / 2
    },
    $packing: function(value) {
      return value * 2
    }
  }),
  offset:     Struct.Uint16,
  string:     Struct.String({
    storage: true, size: 2,
    length: Struct.Ref('length'),
    offset: Struct.Ref('offset')
  })
})

var Name = module.exports = new Struct({
  format:       Struct.Uint16,
  count:        Struct.Uint16,
  stringOffset: Struct.Uint16,
  records:      Struct.Array(Record, Struct.Ref('count')),
  names:        Struct.Storage('records.string', Struct.Ref('stringOffset'))
})

Name.prototype.embed = function(charMap) {
  var postscriptName = null
  for (var i = 0; i < this.records.length; ++i) {
    var record = this.records[i]
    if (record.nameID === 6) {
      if (postscriptName === null) postscriptName = record.string
      this.records.splice(i--, 1)
    }
  }
  this.records.push(new Record({
    platformID: 1,
    encodingID: 0,
    languageID: 0,
    nameID: 6,
    length: 0,
    offset: 0,
    string: "MARKUS+" + postscriptName
  }))
  
  // sample text
  // var sample = this.records.filter(function(record) {
  //   return record.nameID === 19
  // })[0]
  // if (!sample) {
  //   sample = new Record({
  //     platformID: 0,
  //     encodingID: 3,
  //     languageID: 0,
  //     nameID: 19,
  //     length: 0,
  //     offset: 0
  //   })
  //   this.records.push(sample)
  // }
  // sample.string = String.fromCharCode.apply(String, Object.keys(charMap))
}
},{"structjs":33}],30:[function(require,module,exports){
var Struct = require('structjs')
module.exports = (new Struct({
  version:             Struct.Uint16,
  xAvgCharWidth:       Struct.Int16,
  usWeightClass:       Struct.Uint16,
  usWidthClass:        Struct.Uint16,
  fsType:              Struct.Uint16,
  ySubscriptXSize:     Struct.Int16,
  ySubscriptYSize:     Struct.Int16,
  ySubscriptXOffset:   Struct.Int16,
  ySubscriptYOffset:   Struct.Int16,
  ySuperscriptXSize:   Struct.Int16,
  ySuperscriptYSize:   Struct.Int16,
  ySuperscriptXOffset: Struct.Int16,
  ySuperscriptYOffset: Struct.Int16,
  yStrikeoutSize:      Struct.Int16,
  yStrikeoutPosition:  Struct.Int16,
  sFamilyClass:        Struct.Int16,
  panose:              Struct.Array(Struct.Uint8, 10),
  ulUnicodeRange1:     Struct.Uint32,
  ulUnicodeRange2:     Struct.Uint32,
  ulUnicodeRange3:     Struct.Uint32,
  ulUnicodeRange4:     Struct.Uint32,
  achVendID:           Struct.Array(Struct.Int8, 4),
  fsSelection:         Struct.Uint16,
  usFirstCharIndex:    Struct.Uint16,
  usLastCharIndex:     Struct.Uint16
}))
.conditional(function() { return this.version > 0 }, {
  sTypoAscender:       Struct.Int16,
  sTypoDescender:      Struct.Int16,
  sTypoLineGap:        Struct.Int16,
  usWinAscent:         Struct.Uint16,
  usWinDescent:        Struct.Uint16,
  ulCodePageRange1:    Struct.Uint32,
  ulCodePageRange2:    Struct.Uint32
})
.conditional(function() { return this.version > 1 }, {
  sxHeight:            Struct.Int16,
  sCapHeight:          Struct.Int16,
  usDefaultChar:       Struct.Uint16,
  usBreakChar:         Struct.Uint16,
  usMaxContext:        Struct.Uint16
})


},{"structjs":33}],31:[function(require,module,exports){
var Struct = require('structjs')

var Post = module.exports = new Struct({
  version:            Struct.Int32,
  italicAngleHi:      Struct.Int16,
  italicAngleLow:     Struct.Int16,
  underlinePosition:  Struct.Int16,
  underlineThickness: Struct.Int16,
  isFixedPitch:       Struct.Uint32,
  minMemType42:       Struct.Uint32,
  maxMemType42:       Struct.Uint32,
  minMemType1:        Struct.Uint32,
  maxMemType1:        Struct.Uint32
})
},{"structjs":33}],32:[function(require,module,exports){
var Directory = require('./directory')
  , Subset = require('./subset')

var TTFFont = module.exports = function(buffer) {
  var self = this
  this.buffer = buffer = buffer instanceof ArrayBuffer ? buffer : toArrayBuffer(buffer)
  
  this.directory = new Directory()
  this.directory.unpack(new DataView(buffer))
  
  var scalerType = this.directory.scalerType.toString(16)
  if (scalerType !== '74727565' && scalerType !== '10000') {
    throw new Error('Not a TrueType font')
  }
  
  this.tables = {}
  function unpackTable(table, args) {
    var name = table.replace(/[^a-z0-9]/ig, '').toLowerCase()
      , entry = self.directory.entries[table]
    if (!entry) return
    var Table = require('./table/' + name)
      , view  = new DataView(buffer, entry.offset, entry.length)
    if (args) Table = Table.apply(undefined, args)
    self.tables[name] = self.tables[table] = (typeof Table === 'function' ? new Table : Table).unpack(view)
  }
  
  // workaround for browserify
  if (false) {
    require('./table/cmap')
    require('./table/head')
    require('./table/hhea')
    require('./table/maxp')
    require('./table/hmtx')
    require('./table/loca')
    require('./table/glyf')
    require('./table/name')
    require('./table/post')
    require('./table/os2')
  }
  
  unpackTable('cmap')
  for (var i = 0, len = this.tables.cmap.subtables.length; i < len; ++i) {
    var subtable = this.tables.cmap.subtables[i]
    if (subtable.isUnicode) {
      self.codeMap = subtable.table.codeMap
      break
    }
  }
  if (!this.codeMap) throw new Error('Font does not contain a Unicode Cmap.')

  unpackTable('head')
  unpackTable('hhea')
  unpackTable('maxp')
  unpackTable('hmtx', [this.tables.hhea.numOfLongHorMetrics, this.tables.maxp.numGlyphs])
  unpackTable('loca', [this.tables.head.indexToLocFormat, this.tables.maxp.numGlyphs])
  unpackTable('glyf', [this.tables.loca])
  unpackTable('name')
  unpackTable('post')
  // I don't want to bother with post's versions, therefore skip glyhp names
  // by setting version to 3.0, TODO: bother with it ...
  this.tables.post.version = 196608
  unpackTable('OS/2')
  
  this.baseFont = this.tables.name.records.filter(function(record) {
    return record.nameID === 6
  })[0].string
  this.fontName = 'MARKUS+' + this.baseFont
  
  this.scaleFactor = 1000.0 / this.tables.head.unitsPerEm
  
  this.italicAngle = parseFloat(this.tables.post.italicAngleHi + '.' + this.tables.post.italicAngleLow)
  var os2 = this.tables.os2 || {}
  this.ascent      = Math.round((os2.sTypoAscender  || this.tables.hhea.ascent) * this.scaleFactor)
  this.descent     = Math.round((os2.sTypoDescender || this.tables.hhea.descent) * this.scaleFactor)
  this.lineGap     = Math.round((os2.sTypoLineGap   || this.tables.hhea.lineGap) * this.scaleFactor)
  this.capHeight   = os2.sCapHeight || this.ascent
  this.stemV       = 0
  this.bbox        = [this.tables.head.xMin, this.tables.head.yMin, this.tables.head.xMax, this.tables.head.yMax].map(function(val) {
    return Math.round(val * self.scaleFactor)
  })
  
  var flags = 0, familyClass = (os2.sFamilyClass || 0) >> 8
    , isSerif = !!~[1, 2, 3, 4, 5, 6, 7].indexOf(familyClass)
  if (this.tables.post.isFixedPitch) flags |= 1 << 0
  if (isSerif)                       flags |= 1 << 1
  if (familyClass === 10)            flags |= 1 << 3
  if (this.italicAngle !== 0)        flags |= 1 << 6
  /* assume not being symbolic */    flags |= 1 << 5
  this.flags = flags

  this.widths = []
  for (var code in this.codeMap) {
    if (code < 32) continue
    var gid = this.codeMap[code]
    this.widths.push(Math.round(this.tables.hmtx.metrics[gid] * this.scaleFactor))
  }
}

TTFFont.prototype.stringWidth = function(string, size) {
  var width = 0, scale = size / 1000
  for (var i = 0, len = string.length; i < len; ++i) {
    var code = string.charCodeAt(i) - 32 // - 32 because of non AFM font
    width += this.widths[code] || 0
  }
  return width * scale
}

TTFFont.prototype.lineHeight = function(size, includeGap) {
  if (includeGap == null) includeGap = false
  var gap = includeGap ? this.lineGap : 0
  return (this.ascent + gap - this.descent) / 1000 * size
}

TTFFont.prototype.subset = function() {
  return new Subset(this)
}

TTFFont.prototype.save = function() {
  var self = this, tables = ['cmap', 'glyf', 'loca', 'hmtx', 'hhea', 'maxp', 'post', 'name', 'head', 'OS/2']
  for (var name in this.directory.entries) {
    if (!!!~tables.indexOf(name)) delete this.directory.entries[name]
  }
  
  // calculate total size
  var size = offset = this.directory.lengthFor(this.directory, true) * this.directory.sizeFor(this.directory, true)

  tables.forEach(function(name) {
    if (!(name in self.directory.entries)) return
    var table = self.tables[name]
    var length = table ? table.lengthFor(table, true) * table.sizeFor(table, true)
                       : self.directory.entries[name].length
    size += length + length % 4
  })
  
  // prepare head
  this.tables.head.checkSumAdjustment = 0
  
  var view = new DataView(new ArrayBuffer(size + 1000))

  tables.forEach(function(name) {
    if (!(name in self.directory.entries)) return
    var table = self.tables[name], entry = self.directory.entries[name]
    if (!table) {
      var from = new DataView(self.buffer, entry.offset, entry.length)
      for (var i = 0; i < entry.length; ++i) view.setUint8(offset + i, from.getUint8(i))
      entry.offset = offset
    } else {
      table.pack(view, offset)
      entry.offset = offset
      entry.length = table.lengthFor(table, true) * table.sizeFor(table, true)
    }
    
    // pad up to a length completely divisible by 4
    var padding = entry.length % 4, length = entry.length + padding
    for (var i = entry.offset + entry.length, to = i + padding; i < to; ++i)
      view.setInt8(i, 0)
    
    // checksum
    var sum = 0
    for (var i = 0; i < length; i += 4)
      sum += view.getInt32(offset + i)
    entry.checkSum = sum
    
    // update offset for the next table
    offset += length
  })
  
  this.directory.pack(view, 0)
  
  // file checksum
  var sum = 0
  for (var i = 0; i < size; i += 4)
    sum += view.getInt32(i)
  this.tables.head.checkSumAdjustment = 0xB1B0AFBA - sum
  this.tables.head.pack(view, this.directory.entries.head.offset)
  
  return view.buffer
}

TTFFont.Subset = Subset

function toArrayBuffer(buffer) {
  var ab = new ArrayBuffer(buffer.length);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buffer.length; ++i) {
      view[i] = buffer[i];
  }
  return ab;
}
},{"./directory":20,"./subset":21,"./table/cmap":22,"./table/glyf":23,"./table/head":24,"./table/hhea":25,"./table/hmtx":26,"./table/loca":27,"./table/maxp":28,"./table/name":29,"./table/os2":30,"./table/post":31}],33:[function(require,module,exports){
var StructNumber    = require('./types/number')
  , StructString    = require('./types/string')
  , StructHash      = require('./types/hash')
  , StructArray     = require('./types/array')
  , StructReference = require('./types/reference')
  , StructStorage   = require('./types/storage')
  , utils           = require('./utils')

var Struct = module.exports = function(definition, opts) {
  if (!opts) opts = {}
    
  var StructType = function(values) {
    Object.defineProperties(this, {
      _view:       { writable: true, value: null },
      _offset:     { writable: true, value: null },
      _definition: { writable: false, value: definition}
    })
    
    for (var key in values) {
      if (key in definition) this[key] = values[key]
    }
    
    var self = this
    extensions.forEach(function(extension) {
      for (var key in values) {
        if (key in extension.extension) self[key] = values[key]
      }
    })
  }

  Object.defineProperties(StructType, {
    _offset:     { writable: true,  value: null },
    _definition: { writable: false, value: definition }
  })
  StructType.storage = opts.storage
  StructType._offset = opts.offset
  utils.methodsFor(StructType, '_offset',  'offsetFor', 'setOffset')

  var extensions = []
  StructType.conditional = function(condition, extension) {
    extensions.push({ condition: condition, extension: extension })
    return this
  }

  StructType.prototype.unpack = function(view, offset) {
    if (!(view instanceof DataView))
      throw new Error('DataView expected')
  
    if (!offset) offset = 0
    
    this._view = view
  
    var self = this
    function apply(definition) {
      for (var prop in definition) {
        var type = definition[prop]
        definition[prop].prop = prop
        if (type.storage) continue
        self[prop] = type.read(view, offset)
        if (typeof type.$unpacked === 'function')
          self[prop] = type.$unpacked.call(self, self[prop])
        if (self[prop] === undefined) delete self[prop]
        if (!type.external)
          offset += type.lengthFor(self) * type.sizeFor(self)
      }
    }
    apply.parent = this
    apply(definition)

    extensions.forEach(function(extension) {
      if (!extension.condition.call(self)) return
      apply(extension.extension)
    })
  
    if (typeof this.$unpacked === 'function')
      this.$unpacked()
  
    return this
  }

  StructType.prototype.pack = function(view, offset) {
    // console.log('Size: %d, Length: %d', this.sizeFor(this, true), this.lengthFor(this, true))
    if (typeof this.$packing === 'function')
      this.$packing()
      
    if (!view) view = new DataView(new ArrayBuffer(this.lengthFor(this, true) * this.sizeFor(this, true)))
    if (!offset) offset = 0

    var self = this
    function apply(definition) {
      var start = offset
      // write Storages first
      for (var prop in definition) {
        var type = definition[prop]
        if (type.external || type.storage) continue
        if (type instanceof StructStorage)
          type.write(view, offset, self[prop], offset - start)
        offset += type.lengthFor(self, true) * type.sizeFor(self, true)
      }
      offset = start
      // write everything left other than StructNumber second
      for (var prop in definition) {
        var type = definition[prop]
        if (type.external || type.storage) continue
        if (!(type instanceof StructNumber) && !(type instanceof StructStorage))
          type.write(view, offset, self[prop])
        offset += type.lengthFor(self, true) * type.sizeFor(self, true)
      }
      // write StructNumber last
      offset = start
      for (var prop in definition) {
        var type = definition[prop]
        if (type.external || type.storage) continue
        var value = self[prop]
        if (typeof type.$packing === 'function')
          value = self[prop] = type.$packing.call(self, value)
        if (type instanceof StructNumber)
          type.write(view, offset, value)
        offset += type.lengthFor(self, true) * type.sizeFor(self, true)
      }
    }
    apply.parent = this
    apply(definition)

    extensions.forEach(function(extension) {
      if (!extension.condition.call(self)) return
      apply(extension.extension)
    })

    return view.buffer
  }
  
  StructType.read = function read(buffer, offset) {
    var self = new this, parent = read.caller.parent
      , shift = this.storage ? this.offsetFor(parent) : offset
    self.unpack(buffer, shift)
    return self
  }

  StructType.write = function write(buffer, offset, value, relativeOffset) {
    var parent = write.caller.parent
      , shift = this.storage ? offset + this.offsetFor(parent) : offset
    this.setOffset(this.storage ? relativeOffset + this.offsetFor(parent) : offset, parent)
    value.pack(buffer, shift)
  }

  StructType.prototype.lengthFor = StructType.lengthFor = function() {
    return 1
  }

  StructType.prototype.sizeFor = StructType.sizeFor = function(parent, writing) {
    var self = this
    function sizeOf(definition) {
      return Object.keys(definition)
      .filter(function(prop) {
        return !definition[prop].external && !definition[prop].storage
      })
      .map(function(prop) {
        return definition[prop].lengthFor(parent, !!writing) * definition[prop].sizeFor(parent, !!writing)
      })
      .reduce(function(lhs, rhs) {
        return lhs + rhs
      }, 0)
    }
    var size = sizeOf(definition)
    extensions.forEach(function(extension) {
      if (!extension.condition.call(parent)) return
      size += sizeOf(extension.extension)
    })
    return size
  }

  return StructType
}

Struct.Int8    = new StructNumber('getInt8',    'setInt8',    1)
Struct.Uint8   = new StructNumber('getUint8',   'setUint8',   1)
Struct.Int16   = new StructNumber('getInt16',   'setInt16',   2)
Struct.Uint16  = new StructNumber('getUint16',  'setUint16',  2)
Struct.Int32   = new StructNumber('getInt32',   'setInt32',   4)
Struct.Uint32  = new StructNumber('getUint32',  'setUint32',  4)
Struct.Float32 = new StructNumber('getFloat32', 'setFloat32', 4)
Struct.Float64 = new StructNumber('getFloat64', 'setFloat64', 8)

Struct.String = function(length) {
  return new StructString(length)
}

Struct.Hash = function(struct, key, length) {
  return new StructHash(struct, key, length)
}

Struct.Array = function(struct, length) {
  return new StructArray(struct, length)
}

Struct.Reference = Struct.Ref = function(prop) {
  return new StructReference(prop)
}

Struct.Storage = function(path, opts) {
  return new StructStorage(path, opts)
}
},{"./types/array":34,"./types/hash":35,"./types/number":36,"./types/reference":37,"./types/storage":38,"./types/string":39,"./utils":40}],34:[function(require,module,exports){
var utils = require('../utils')
  , StructReference = require('./reference')

var StructArray = module.exports = function(struct, length) {
  this.struct = struct
  Object.defineProperties(this, {
    _length: { value: length, writable: true }
  })
}

StructArray.prototype.read = function read(buffer, offset) {
  var arr = [], parent = read.caller.parent
  for (var i = 0, len = this.lengthFor(parent); i < len; ++i) {
    var child
    if (typeof this.struct === 'function') {
      child = new this.struct
      child.unpack(buffer, offset)
      offset += child.lengthFor(parent) * child.sizeFor(parent)
    } else {
      child = this.struct.read(buffer, offset)
      offset += this.struct.lengthFor(parent) * this.struct.sizeFor(parent)
    }
    arr.push(child)
  }
  return arr
}

StructArray.prototype.write = function write(buffer, offset, arr) {
  var parent = write.caller.parent, child
  this.setLength(this.lengthFor(parent, true), parent)
  for (var i = 0, len = this.lengthFor(parent); i < len; ++i) {
    if ((child = arr[i]) === undefined) break
    if (typeof this.struct === 'function') {
      child.pack(buffer, offset)
      offset += child.lengthFor(parent) * child.sizeFor(parent)
    } else {
      this.struct.write(buffer, offset, child)
      offset += this.struct.lengthFor(parent) * this.struct.sizeFor(parent)
    }
  }
}

StructArray.prototype.sizeFor = function(parent) {
  return (this.struct.sizeFor ? this.struct.sizeFor(parent) : this.struct.prototype.sizeFor(parent))
       * (this.struct.lengthFor ? this.struct.lengthFor(parent) : this.struct.prototype.lengthFor(parent))
}

StructArray.prototype.lengthFor = function(parent, writing) {
  if (!this._length) return 0
  if (this._length instanceof StructReference) {
    if (writing) return parent[this.prop].length
    return parent[this._length.prop]
  } else if (typeof this._length === 'function') {
    return this._length.call(parent)
  }
  return this._length
}

StructArray.prototype.setLength = function(value, parent) {
  if (this._length instanceof StructReference)
    parent[this._length.prop] = value
  else this._length = value
}
},{"../utils":40,"./reference":37}],35:[function(require,module,exports){
var utils = require('../utils')
  , StructReference = require('./reference')

var StructHash = module.exports = function(struct, key, length) {
  this.struct = struct
  this.key    = key
  Object.defineProperties(this, {
    _length: { value: length, writable: true }
  })
}

StructHash.prototype.read = function read(buffer, offset) {
  var hash = {}, parent = read.caller.parent
  for (var i = 0, len = this.lengthFor(parent); i < len; ++i) {
    var child = new this.struct
    child.unpack(buffer, offset)
    offset += child.lengthFor(parent) * child.sizeFor(parent)
    hash[child[this.key]] = child
  }
  return hash
}

StructHash.prototype.write = function write(buffer, offset, hash) {
  var keys = Object.keys(hash), parent = write.caller.parent, child
  this.setLength(this.lengthFor(parent, true), parent)
  for (var i = 0, len =  this.lengthFor(parent); i < len; ++i) {
    if (!(child = hash[keys[i]])) continue
    child.pack(buffer, offset)
    offset += child.lengthFor(parent) * child.sizeFor(parent)
  }
}

StructHash.prototype.sizeFor = function(parent) {
   return (this.struct.sizeFor ? this.struct.sizeFor(parent) : this.struct.prototype.sizeFor(parent))
        * (this.struct.lengthFor ? this.struct.lengthFor(parent) : this.struct.prototype.lengthFor(parent))
}

StructHash.prototype.lengthFor = function(parent, writing) {
  if (!this._length) return 0
  if (this._length instanceof StructReference) {
    if (writing) return Object.keys(parent[this.prop]).length
    return parent[this._length.prop]
  }
  return this._length
}

StructHash.prototype.setLength = function(value, parent) {
  if (this._length instanceof StructReference)
    parent[this._length.prop] = value
  else this._length = value
}

},{"../utils":40,"./reference":37}],36:[function(require,module,exports){
var utils = require('../utils')

var StructNumber = module.exports = function(read, write, length) {
  this.methods = { read: read, write: write }
  Object.defineProperties(this, {
    _offset: { value: null, writable: true },
    _length: { value: null, writable: true }
  })
  utils.options.call(this, length)
}

StructNumber.prototype.with = function(opts) {
  if (!opts.length) opts.length = this._length
  return new StructNumber(this.methods.read, this.methods.write, opts)
}

StructNumber.prototype.from = function(offset) {
  return this.with({ external: true, offset: offset })
}

StructNumber.prototype.read = function read(buffer, offset) {
  var parent = read.caller.parent
  return buffer[this.methods.read](this.external ? this.offsetFor(parent) : offset)
}

StructNumber.prototype.write = function write(buffer, offset, value) {
  var parent = write.caller.parent
  buffer[this.methods.write](this.external ? this.offsetFor(parent) : offset, value)
}

StructNumber.prototype.lengthFor = function() {
  return 1
}

StructNumber.prototype.sizeFor = function() {
  return this._length
}

utils.methodsFor(StructNumber.prototype, '_offset', 'offsetFor', 'setOffset')
},{"../utils":40}],37:[function(require,module,exports){
var StructReference = module.exports = function(prop) {
  this.prop = prop
}
},{}],38:[function(require,module,exports){
var utils = require('../utils')
  , StructReference = require('./reference')
  , StructArray     = require('./array')

var StructStorage = module.exports = function(path, opts) {
  this.path = path
  if (opts instanceof StructReference) 
    opts = { offset: opts }
  opts = opts || {}
  Object.defineProperties(this, {
    _offset: { value: opts.offset, writable: true }
  })
}

StructStorage.prototype.read = function read(view, offset) {
  var parent = read.caller.parent
    , shift  = this.offsetFor(parent) || offset
  !function traverse(path, definition, target) {
    var step = path.shift(), type = definition[step]
    traverse.parent = target
    if (!path.length) {
      target[step] = type.read(view, shift)
    } else if (type instanceof StructArray) {
      target[step].forEach(function(target) {
        traverse(path.concat([]), type.struct._definition, target)
      })
    } else {
      traverse(path, type, target[step])
    }
  }(this.path.split('.'), parent._definition, parent)
}

StructStorage.prototype.write = function write(view, offset, _, relativeOffset) {
  var parent = write.caller.parent, shift = 0
  this.setOffset(relativeOffset, parent)
  !function traverse(path, definition, target) {
    var step = path.shift(), type = definition[step]
    traverse.parent = target
    if (!path.length) {
      type.setOffset(shift, target)
      var value = target[step], target = type.prototype ? target[step] : target
      type.write(view, offset, value, relativeOffset)
      shift += type.lengthFor(target, true) * type.sizeFor(target, true)
    } else if (type instanceof StructArray) {
      target[step].forEach(function(target) {
        traverse(path.concat([]), type.struct._definition, target)
      })
    } else {
      traverse(path, type, target[step])
    }
  }(this.path.split('.'), parent._definition, parent)
}

StructStorage.prototype.lengthFor = function() {
  return 1
}

StructStorage.prototype.sizeFor = function(parent, writing) {
  var size = 0
  !function traverse(path, definition, target) {
    var step = path.shift(), type = definition[step]
    traverse.parent = target
    if (!path.length) {
      if (type.prototype) target = target[step]
      size += type.lengthFor(target, writing) * type.sizeFor(target, writing)
    } else if (type instanceof StructArray) {
      target[step].forEach(function(target) {
        traverse(path.concat([]), type.struct._definition, target)
      })
    } else {
      traverse(path, type, target[step])
    }
  }(this.path.split('.'), parent._definition, parent)
  return size
}

utils.methodsFor(StructStorage.prototype, '_offset', 'offsetFor', 'setOffset')
},{"../utils":40,"./array":34,"./reference":37}],39:[function(require,module,exports){
var utils = require('../utils')
  , StructReference = require('./reference')

var StructString = module.exports = function(length) {
  Object.defineProperties(this, {
    _offset: { value: null, writable: true },
    _length: { value: null, writable: true },
    _size:   { value: null, writable: true }
  })
  utils.options.call(this, length)
}

StructString.prototype.read = function read(buffer, offset) {
  var str = [], storage, parent = read.caller.parent
    , shift = this.external
      ? this.offsetFor(parent)
      : (this.storage ? offset + this.offsetFor(parent) : offset)
  for (var i = 0, len = this.lengthFor(parent), step = this.sizeFor() === 2 ? 2 : 1; i < len; ++i) {
    str.push(buffer[this.sizeFor() === 2 ? 'getUint16' : 'getUint8'](shift + i * step, this.littleEndian))
  }
  return String.fromCharCode.apply(null, str)
}

StructString.prototype.write = function write(buffer, offset, value) {
  var str = [], storage, parent = write.caller.parent
    , shift = this.external
      ? this.offsetFor(parent)
      : (this.storage ? offset + this.offsetFor(parent) : offset)
  this.setLength(this.lengthFor(parent, true), parent)
  for (var i = 0, len = this.lengthFor(parent), step = this.sizeFor() === 2 ? 2 : 1; i < len; ++i) {
    var code = value.charCodeAt(i) || 0x00
    buffer[this.sizeFor() === 2 ? 'setUint16' : 'setUint8'](shift + i * step, code, this.littleEndian)
  }
}

StructString.prototype.sizeFor = function() {
  return this._size || 1
}

StructString.prototype.lengthFor = function(parent, writing) {
  if (this._length instanceof StructReference) {
    if (writing) return parent[this.prop].length
    return parent[this._length.prop]
  }
  return this._length || 0
}

StructString.prototype.setLength = function(value, parent) {
  if (this._length instanceof StructReference)
    parent[this._length.prop] = value
  else this._length = value
}

utils.methodsFor(StructString.prototype, '_offset',  'offsetFor', 'setOffset')

},{"../utils":40,"./reference":37}],40:[function(require,module,exports){
var StructReference = require('./types/reference')

exports.methodsFor = function(obj, prop, get, set) {
  obj[get] = function(parent) {
    if (!this[prop]) return 0
    if (this[prop] instanceof StructReference)
      return parent[this[prop].prop]
    else if (typeof this[prop] === 'function')
      return this[prop].call(parent)
    return this[prop]
  }
  if (!set) return
  obj[set] = function(value, parent) {
    if (this[prop] instanceof StructReference)
      parent[this[prop].prop] = value
    else this[prop] = value
  }
}

exports.options = function(opts) {
  if (typeof opts === 'object') {
    this._offset      = opts.offset
    this._length      = opts.length
    this._size        = opts.size
    this.$unpacked    = opts.$unpacked
    this.$packing     = opts.$packing
    this.external     = opts.external === true
    this.storage      = opts.storage
    this.littleEndian = opts.littleEndian === true
  } else {
    this._length  = opts
  }
}
},{"./types/reference":37}]},{},[4])
(4)
});
;