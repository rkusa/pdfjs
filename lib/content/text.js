'use strict'

var PDFString = require('../objects/string')
var utils     = require('../utils')

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
  if (typeof str === 'function') {
    this.contents.push(new Word(str, font, opts))
  } else {
    var words = str.toString().replace(/\t/g, ' ').replace(/\r\n/g, '\n').split(/ +|^|$/mg)
    // if (words[0].match(/\.\!\?\,/) && this.contents.length)
    //   this.contents[this.contents.length - 1].content += words.shift()
    words.forEach(function(word) {
      if (!word.length) return
      font.use(word)
      self.contents.push(new Word(word, font, opts))
    })
  }
  return this.textFn
}

Text.prototype.text.br = function() {
  this.contents.push(new Word('\n', this.opts.font ? this.doc.registerFont(this.opts.font) : this.doc.defaultFont.regular, {
    size: this.opts.size
  }))
  return this.textFn
}

Text.prototype.text.pageNumber = function() {
  this.text(function() {
    if (!this.pages && !this.doc) return null
    return (this.pages || this.doc.pages).count
  })
  return this.textFn
}

Text.prototype.render = function(page, width, context) {
  var self       = this
  var spaceLeft  = width
  var line       = []
  var lastFont, lastSize

  function renderLine(line, textWidth, isLastLine) {
    var lineHeight = Math.max.apply(Math, line.map(function(word) {
      return word.height
    }))

    // only a line break
    if (line.length === 1 && line[0].word === '\n') {
      page.cursor.y -= lineHeight * (self.opts.lineSpacing || 1)
      return
    }

    var left = page.cursor.x

    // page break
    if (round(page.spaceLeft) < round(lineHeight)) {
      page = self.doc.pagebreak()
      page.cursor.x = left
      lastFont = undefined
    }

    page.cursor.y -= lineHeight

    var remainingSpace = width - textWidth
    var wordCount = line.length
    var wordSpacing

    // begin text
    page.contents.writeLine('BT')

    // alignement
    switch (self.opts.align) {
      case 'right':
        left += remainingSpace
        break
      case 'center':
        left += width / 2 - (width - remainingSpace) / 2
        break
      case 'justify':
        if (isLastLine && 100 * remainingSpace / width > 20) break
        wordSpacing = remainingSpace / (wordCount - 1)
        break
    }

    // position the text in user space
    page.contents.writeLine('1 0 0 1 ' + left + ' ' + page.cursor.y + ' Tm')
    var offset = 0

    line.forEach(function(word, i) {
      if (word.word === '\n') return

      // move cursor manually for word spacing, since Tw does not work for
      // multi byte fonts
      if (wordSpacing) {
        page.contents.writeLine(offset + ' 0 Td')
      }

      var str  = word.font.encode(word.word)
      var size = word.opts.size || 10

      if (lastFont !== word.font || lastSize !== size) {
        page.contents.writeLine([word.font.id, size, 'Tf'].join(' '))
        lastFont = word.font
        lastSize = size
      }

      offset = word.width + word.spacing + (wordSpacing || 0)
      if (i > 0 && !word.isStartingWithPunctuation && !wordSpacing) {
        str = ' ' + str
      }

      page.contents.writeLine((new PDFString(str)).toHexString() + ' Tj')
    })

    page.contents.writeLine('ET')

    page.cursor.y -= lineHeight * ((self.opts.lineSpacing || 1) - 1)
  }

  this.contents.forEach(function(word) {
    word.context = context || (self.doc.doc || self.doc)
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
  this.context = {}
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
      if (!this.word[0]) return false
      return this.word[0].match(/\.|\!|\?|,/) !== null
    }
  }
})

Word.prototype.toString = function() {
  if (typeof this._word === 'function') {
    var res = (this._word.call(this.context) || '').toString()
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
