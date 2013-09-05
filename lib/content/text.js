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

Text.prototype.prepare = function(width) {
  var self       = this
    , spaceLeft  = width
    , lines      = new Lines(width, this.opts)
    , finishedAt = this.contents.length - 1
    , line       = new Line
    , self       = this
    
  this.contents.forEach(function(word, i) {
    var wordWidth = word.width, wordSpacing = !line.length || word.isStartingWithPunctuation ? 0 : word.spacing
    
    if (word.word === '\n' || (line.length > 0 && spaceLeft - (wordWidth + wordSpacing) < 0)) {
      wordSpacing = 0
      line.textWidth = width - spaceLeft
      line.isLastLine = i === finishedAt || word === '\n'
      lines.push(line)
      spaceLeft = width
      line = new Line
      if (word.word === '\n') return
    }
    
    spaceLeft -= wordWidth + wordSpacing
    line.push(word)
  })
  
  if (line.length) {
    line.textWidth = width - spaceLeft
    line.isLastLine = true
    lines.push(line)
  }
  
  return lines
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
  maxLineHeight: {
    enumerable: true,
    get: function() {
      return Math.max.apply(Math, this.contents.map(function(word) {
        return word.height
      }))
    }
  }
})

var Word = function(word, font, opts) {
  this.word = word
  this.font = font
  this.opts = opts || {}
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
  return this.word
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

var Lines = function(width, opts) {
  var lines = []
  lines.render = function(page, y, x) {
    var lastFont, lastSize
    if (!x) x = page.doc.padding.left
  
    this.forEach(function(line, i) {
      y -= line.lineHeight
      
      var spaceLeft = width - line.textWidth
        , left = x
        , wordCount = line.length
        , toPrint = ''
  
      // begin text
      page.contents.writeLine('BT')
      
      // alignement
      switch (opts.align) {
        case 'right':
          left += spaceLeft
          break
        case 'center':
          left += width / 2 - (width - spaceLeft) / 2
          break
        case 'justify':
          if (line.isLastLine && 100 * spaceLeft / width > 20) break
          var wordSpacing = spaceLeft / (wordCount - 1)
          // set word spacing
          page.contents.writeLine(wordSpacing + ' Tw')
      }
    
      // position the text in user space
      page.contents.writeLine(left + ' ' + y + ' Td')
    
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
      
      y -= line.lineHeight * ((opts.lineSpacing || 1) - 1)
    })
  }
  lines.break = function(spaceLeft) {
    var self = this, i = 0
    for (len = this.length; i < len; ++i) {
      var line = this[i], lineHeight = line.lineHeight * (opts.lineSpacing || 1)
      if (spaceLeft < lineHeight) break
      spaceLeft -= lineHeight
    }
    var succ = new Lines(width, opts)
    succ.push.apply(succ, this.splice(i, this.length - i))
    return succ
  }
  Object.defineProperties(lines, {
    height: {
      enumerable: true,
      get: function() {
        return this.map(function(line) {
          return line.lineHeight * (opts.lineSpacing || 1)
        }).reduce(function(lhs, rhs) {
          return lhs + rhs
        }, 0)
      }
    }
  })
  return lines
}