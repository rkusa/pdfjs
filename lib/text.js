var PDFStream = require('./datatypes/stream')
  , Font = require('./font')
  
var WORD = /([^ ,\/!.?:;\-\n]+[,\/!.?:;\-]*)|\n/g
  
var Text = module.exports = function(page, text, options) {
  this.page    = page
  this.options = options || {}
  this.width   = this.options.width || page.document.innerWidth
  
  this.fontSize = this.options.size || 11
  this.font     = this.options.font || page.document.font('Helvetica')
  
  page.addFont(this.font)
  
  this.lineHeight  = this.font.lineHeight(this.fontSize, true)
  this.wordSpacing = this.font.stringWidth(' ', this.fontSize)
  
  this.lines = []
  
  var words = text.match(WORD) // split text into words
    , x = 70
    , spaceLeft  = this.width
    , finishedAt = words.length - 1
    , line  = []
    , self = this
  
  words.forEach(function(word, i) {
    var wordWith = self.font.stringWidth(word, self.fontSize)
    
    if (word === '\n' || spaceLeft - (wordWith + self.wordSpacing) < 0) {
      self.lines.push({
        line: line,
        textWidth: self.width - spaceLeft,
        isLastLine: i === finishedAt || word === '\n'
      })
      spaceLeft = self.width
      line = []
      if (word === '\n') return
    }
    
    spaceLeft -= wordWith + self.wordSpacing
    line.push(word)
  })
  
  if (line.length) {
    self.lines.push({
      line: line,
      textWidth: this.width - spaceLeft,
      isLastLine: true
    })
  }
}

Text.width = function(text, font, fontSize) {
  var words = text.match(WORD)
    , wordSpacing = font.stringWidth(' ', fontSize)
  return font.stringWidth(words.join('') + words.length * wordSpacing, fontSize)
}

Text.prototype.print = function(x, y) {
  var self = this
  y -= this.lineHeight
  this.lines.forEach(function(line) {
    // page break
    if (y < self.page.document.padding[2]) {
      y = self.page.document.height - self.page.document.padding[0] - self.lineHeight
      self.page = self.page.document.addPage()
      self.page.addFont(self.font)
    }
    
    var spaceLeft = self.width - line.textWidth
      , left = x
      , wordCount = line.line.length
      , text = line.line.join(' ')
  
    // begin text
    self.page.contents.writeLine('BT')
  
    // set fontfamily and -size
    self.page.contents.writeLine('/F1 ' + self.fontSize + ' Tf')
  
    // alignement
    switch (self.options.align) {
      case 'right':
        left += spaceLeft
        break
      case 'center':
        left += self.width / 2 - (self.width - spaceLeft) / 2
        break
      case 'justify':
        if (line.isLastLine && 100 * spaceLeft / self.width > 20) break
        var wordSpacing = spaceLeft / (wordCount - 1)
        self.page.contents.writeLine(wordSpacing + ' Tw')
    }
  
    // position the text in user space
    self.page.contents.writeLine(left + ' ' + y + ' Td')
  
    // print text
    self.page.contents.writeLine('(' + text.replace(/\)/g, '\\)').replace(/\(/g, '\\(') + ') Tj')

    // end text
    self.page.contents.writeLine('ET')
  
    y -= self.lineHeight
  })
  
  return y
}