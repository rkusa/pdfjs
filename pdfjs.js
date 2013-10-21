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
  var table = new Table(this, opts, definition)
  this.contents.push(table)
  return table
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
  this.opts = opts || {}
  
  mergeOption(defaults, this.opts)
  
  this.rows = []
  
  if (definition) definition.call(this, this)
}

Table.prototype.tr = function(opts, definition) {
  var row = new Row(this, opts, definition)
  this.rows.push(row)
  return row
}

Table.prototype.render = function(page, width) {
  var columns = [], self = this
    , maxWidth = minWidth = width

  if (Array.isArray(this.opts.width)) {
    var widths = this.opts.width

    var absolute = 0
    widths.forEach(function(width, i) {
      if (!!~width.toString().indexOf('%'))
        return
      absolute += (columns[i] = parseFloat(width))
    })

    var remaining = maxWidth - absolute
    widths.forEach(function(width, i) {
      if (!!~width.toString().indexOf('%')) {
        columns[i] = utils.resolveWidth(width, remaining)
      }
    })
  } else {
    if ('width' in this.opts)
      minWidth = utils.resolveWidth(widths, maxWidth)

    var highestRowWidth = Math.max.apply(Math, this.rows.map(function(row) {
      return row.cells.map(function(cell, i) {
        if (columns[i] === undefined || (cell.width > columns[i] && !(cell.opts.colspan > 1)))
          columns[i] = cell.width
        return cell.width
      }).reduce(function(lhs, rhs) { return lhs + rhs }, 0)
    }))
    
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
  this.opts  = mergeOption(table.opts, opts || {})
  
  this.cells = []

  this.allowBreak = false
  
  if (definition) definition.call(this, this)
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
  if (typeof text === 'object') {
    var fn = opts
    opts = text
    text = fn
  }
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
    if (key === 'width') continue
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

  return text.textFn
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
  if (!str) return this.textFn
  opts = utils.extend(opts || {}, this.opts)
  var self = this, font = (opts.font ? this.doc.registerFont(opts.font) : this.doc.defaultFont).fromOpts(opts)
  var words = str.toString().replace(/\t/g, ' ').replace(/\r\n/g, '\n').split(/ +|^|$/mg)
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
  this.contents.push(new Word('\n', this.opts.font ? this.doc.registerFont(opts.font) : this.doc.defaultFont.regular, {
    size: this.opts.size
  }))
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
    
    // only a line break
    if (line.length === 1 && line[0].word === '\n') {
      page.cursor.y -= lineHeight * (self.opts.lineSpacing || 1)
      return
    }
    
    // page break
    if (round(page.spaceLeft) < round(lineHeight)) {
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
      if (word.word === '\n') return
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
      if (word.word === '\n') line.push(word)
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

function round(num) {
  return Math.round(num * 100) / 100
}
},{"../objects/string":14,"../utils":17}],4:[function(require,module,exports){
var PDFObject = require('./objects/object')
  , Pages     = require('./pages')
  , Font      = require('./font')
  , TTFFont   = require('./fonts/ttf')
  , PDFName   = require('./objects/name')
  , utils = require('./utils')

var Document = module.exports = function Document(font, opts) {
  this.version = 1.7
  
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
utils.inherits(Document, Fragment);

Document.Font = Font

;['header', 'footer'].forEach(function(area) {
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
      , transaction = this.startTransaction()
      , y = page.cursor.y
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
  return 'data:application/pdf;base64,' + Base64.encode(this.toString())
}

var PDFDictionary = require('./objects/dictionary')
  , PDFArray      = require('./objects/array')
  , PDFString     = require('./objects/string')

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
    , trailer = new PDFDictionary({
      Size: (this.objects.length + 1),
      Root: this.catalog.toReference(),
      ID:   new PDFArray([id, id])
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
      
      // workaround to not encode UTF8 characters
      // TODO: improve ...
      utftext += String.fromCharCode(Math.min(c, 0xff))
      continue

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
      >> a/4         // 8 to 11
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
},{"./font":5,"./fonts/ttf":6,"./fragment":7,"./objects/array":8,"./objects/dictionary":9,"./objects/name":10,"./objects/object":11,"./objects/string":14,"./pages":16,"./utils":17}],5:[function(require,module,exports){
var TTFFont = require('./fonts/ttf')
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
},{"./fonts/ttf":6,"./objects/name":10,"fs":18}],6:[function(require,module,exports){
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
  doc.objects.push(font)
  
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
  var data = this.save()
    , hex = asHex(data)
  
  var file = new PDFStream(doc.createObject())
  file.object.prop('Length', hex.length + 1)
  file.object.prop('Length1', data.byteLength)
  file.object.prop('Filter', 'ASCIIHexDecode')
  file.content = hex + '>\n'
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

},{"../objects/array":8,"../objects/stream":13,"ttfjs":31}],7:[function(require,module,exports){
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
  
  // white-space characters are not allowed
  if (name.match(/[\x00]/))
    throw new Error('A Name mustn\'t contain the null characters')
    
  // delimiter characters are not allowed
  if (name.match(/[\(\)<>\[\]\{\}\/\%]/))
    throw new Error('A Name mustn\'t contain delimiter characters')

  name = name.toString()
  // Beginning with PDF 1.2, any character except null (character code 0)
  // may be included in a name by writing its 2-digit hexadecimal code,
  // preceded by the number sign character (#)
  // ... it is recommended but not required for characters whose codes
  // are outside the range 33 (!) to 126 (~)
  name = name.replace(/[^\x21-\x7e]/g, function(c) {
    var code = c.charCodeAt(0)
    // replace unicode characters with `_`
    if (code > 0xff) code = 0x5f
    return '#' + code
  })
  
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
  this.id         = id || null
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
  this.object.prop('Length', this.content.length - 1)
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
  return this.toLiteralString()
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
    x: 0
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

exports.resolveWidth = function(width, maxWidth) {
  var isRelative = !!~width.toString().indexOf('%')
  width = parseFloat(width)
  if (isRelative) {
    if (width >= 100) return maxWidth
    return (width / 100) * maxWidth
  } else {
    if (width > maxWidth) return maxWidth
    else return width
  }
}
},{}],18:[function(require,module,exports){
// nothing to see here... no file methods for the browser

},{}],19:[function(require,module,exports){
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
},{"structjs":32}],20:[function(require,module,exports){
var Subset = module.exports = function(font) {
  this.font    = font.clone()
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

Subset.prototype.save = function() {
  return this.font.save()
}
},{}],21:[function(require,module,exports){
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
},{"structjs":32}],22:[function(require,module,exports){
var Struct = require('structjs')

module.exports = function(loca) {
  return new Glyf(loca)
}

var Glyf = function(loca) {
  this.loca  = loca
  this.cache = {}
}

Glyf.prototype.clone = function() {
  var clone = new Glyf(this.loca)
  clone.cache = this.cache
  return clone
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
},{"structjs":32}],23:[function(require,module,exports){
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
},{"structjs":32}],24:[function(require,module,exports){
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
},{"structjs":32}],25:[function(require,module,exports){
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


},{"structjs":32}],26:[function(require,module,exports){
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
},{"structjs":32}],27:[function(require,module,exports){
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
},{"structjs":32}],28:[function(require,module,exports){
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
},{"structjs":32}],29:[function(require,module,exports){
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


},{"structjs":32}],30:[function(require,module,exports){
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
},{"structjs":32}],31:[function(require,module,exports){
var Directory = require('./directory')
  , Subset = require('./subset')

var TTFFont = module.exports = function(buffer) {
  var self = this
  this.buffer = buffer instanceof TTFFont
                ? buffer.buffer
                : buffer = buffer instanceof ArrayBuffer ? buffer : toArrayBuffer(buffer)
  
  if (buffer instanceof TTFFont) {
    this.directory = buffer.directory.clone()
  } else {
    this.directory = new Directory()
    this.directory.unpack(new DataView(buffer))
  }
  
  var scalerType = this.directory.scalerType.toString(16)
  if (scalerType !== '74727565' && scalerType !== '10000') {
    throw new Error('Not a TrueType font')
  }
  
  this.tables = {}
  function unpackTable(table, args) {
    var name = table.replace(/[^a-z0-9]/ig, '').toLowerCase()
      , entry = self.directory.entries[table]
    if (!entry) return
    if (buffer instanceof TTFFont) {
      self.tables[name] = self.tables[table] = buffer.tables[table].clone()
      return
    }
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

TTFFont.TABLES = ['cmap', 'glyf', 'loca', 'hmtx', 'hhea', 'maxp', 'post', 'name', 'head', 'OS/2']

TTFFont.prototype.clone = function() {
  var clone = new TTFFont(this)
  clone.tables.glyf.view = this.tables.glyf.view
  return clone
}

TTFFont.prototype.save = function() {
  var self = this, tables = TTFFont.TABLES
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
  
  var view = new DataView(new ArrayBuffer(size))

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
},{"./directory":19,"./subset":20,"./table/cmap":21,"./table/glyf":22,"./table/head":23,"./table/hhea":24,"./table/hmtx":25,"./table/loca":26,"./table/maxp":27,"./table/name":28,"./table/os2":29,"./table/post":30}],32:[function(require,module,exports){
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
      if (key in definition) this[key] = cloneValue(values[key])
    }
    
    var self = this
    extensions.forEach(function(extension) {
      for (var key in values) {
        if (key in extension.extension) self[key] = cloneValue(values[key])
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
          value = type.$packing.call(self, value)
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
  
  StructType.prototype.clone = function() {
    var clone = new StructType(this)
    if (typeof clone.$unpacked === 'function') clone.$unpacked()
    return clone
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

// Helper

function cloneValue(val) {
  if (val === undefined) {
    return undefined
  } else if (typeof val.clone === 'function') {
    return val.clone()
  } else if (Array.isArray(val)) {
    return [].concat(val)
  } else if (typeof val === 'object') {
    var clone = {}
    for (key in val)
      clone[key] = cloneValue(val[key])
    return clone
  } else {
    return val
  }
}
},{"./types/array":33,"./types/hash":34,"./types/number":35,"./types/reference":36,"./types/storage":37,"./types/string":38,"./utils":39}],33:[function(require,module,exports){
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
  for (var i = 0, len = this.lengthFor(parent, true); i < len; ++i) {
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
  else if (typeof this._length === 'function') {
    return
  } 
  else this._length = value
}
},{"../utils":39,"./reference":36}],34:[function(require,module,exports){
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

},{"../utils":39,"./reference":36}],35:[function(require,module,exports){
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
},{"../utils":39}],36:[function(require,module,exports){
var StructReference = module.exports = function(prop) {
  this.prop = prop
}
},{}],37:[function(require,module,exports){
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
},{"../utils":39,"./array":33,"./reference":36}],38:[function(require,module,exports){
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

},{"../utils":39,"./reference":36}],39:[function(require,module,exports){
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
},{"./types/reference":36}]},{},[4])
(4)
});
;