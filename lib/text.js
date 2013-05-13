var PDFStream = require('./datatypes/stream')
  , Font = require('./font')
  
var WORD = /([^ ,\/!.?:;\-\n]+[,\/!.?:;\-]*)|\n/g
  
var Text = module.exports = function(page, text, options) {
  this.page   = page
  this.text   = text
  this.stream = page.contents
  
  this.fontSize = options.size || 12
  this.font     = options.font || page.document.font('Helvetica')
  
  page.addFont(this.font)
  
  this.x = 70
  this.y = 550
  
  this.lineHeight  = this.font.lineHeight(this.fontSize, true)
  this.wordSpacing = this.font.stringWidth(' ', this.fontSize)
  this.lastLine    = false
  
  var words = text.match(WORD) // split text into words
    , x = 70
    , spaceLeft  = options.width
    , finishedAt = words.length - 1
    , line  = []
    , self = this
  
  words.forEach(function(word, i) {
    var wordWith = self.font.stringWidth(word, self.fontSize)
    
    if (word === '\n' || spaceLeft - (wordWith + self.wordSpacing) < 0) {
      if (i === finishedAt) this.lastLine = true
      self.printLine(line, options.width - spaceLeft, options)
      spaceLeft = options.width
      line = []
      if (word === '\n') return
    }
    
    spaceLeft -= wordWith + self.wordSpacing
    line.push(word)
    
    // console.log(word + ' ' + wordWith)
  })
  if (line.length) {
    this.lastLine = true
    self.printLine(line, options.width - spaceLeft, options)
  }
  this.lastLine = false
}

Text.prototype.printLine = function(text, textWidth, options) {
  var text, wordCount
  if (Array.isArray(text)) {
    wordCount = text.length
    text = text.join(' ')
  } else {
    wordCount = text.match(WORD).length
  }

  if (typeof textWidth === 'object') {
    options = textWidth
    textWidth = this.font.stringWidth(text, this.fontSize)
  }
  var spaceLeft = options.width - textWidth
    , x = this.x
  
  // begin text
  this.stream.writeLine('BT')
  
  // set fontfamily and -size
  this.stream.writeLine('/F1 ' + this.fontSize + ' Tf')
  
  // alignement
  switch (options.align) {
    case 'right':
      x += spaceLeft
      break
    case 'center':
      x += options.width / 2 - (options.width - spaceLeft) / 2
      break
    case 'justify':
      if (this.lastLine) break
      var wordSpacing = spaceLeft / (wordCount - 1)
      this.stream.writeLine(wordSpacing + ' Tw')
  }
  
  // position the text in user space
  this.stream.writeLine(x + ' ' + this.y + ' Td')
  
  // print text
  this.stream.writeLine('(' + text + ') Tj')

  // end text
  this.stream.writeLine('ET')
  
  this.y -= this.lineHeight
}