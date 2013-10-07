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