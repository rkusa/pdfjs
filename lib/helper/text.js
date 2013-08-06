var PDFStream = require('../datatypes/stream')
  
var Text = module.exports = function(page, left, text, options) {
  this.page    = page
  this.x       = left
  this.options = options || {}
  this.width   = this.options.width || page.document.innerWidth
  
  this.fontSize = this.options.size || 12
  this.font     = this.options.font || page.document.font('Helvetica', this.options)
  
  page.addFont(this.font)
  
  this.lineHeight  = this.font.lineHeight(this.fontSize, true)
  this.wordSpacing = this.font.stringWidth(' ', this.fontSize)
  
  this.lines = []
  
  var words = this.font.encode(text.toString()).replace(/\r\n/, '\n').split(/ +|^|$/mg) // split text into words
    , x = 70
    , spaceLeft  = this.width
    , finishedAt = words.length - 1
    , line  = []
    , self = this
  
  words.forEach(function(word, i) {
    var wordWith = self.font.stringWidth(word, self.fontSize)
    
    if (word === '\n' || (line.length > 0 && spaceLeft - (wordWith + self.wordSpacing) < 0)) {
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

Object.defineProperty(Text.prototype, 'height', {
  enumerable: true,
  get: function() {
    return this.font.lineGap / 1000 * this.fontSize
         + this.lineHeight * (this.lines.length + 1)
  }
})

Text.width = function(text, font, fontSize) {
  if (!text) return 0
  var words = font.encode(text.toString()).split(/ +|^|$/mg)
    , wordSpacing = font.stringWidth(' ', fontSize)
  return font.stringWidth(words.join(' '), fontSize) + (words.length - 1) * wordSpacing
}

Text.prototype.print = function(y, x) {
  var self = this
  if (!x) x = this.x
  y -= this.lineHeight
  this.lines.forEach(function(line) {
    // page break
    if (y < self.page.padding.bottom) {
      var page = self.page = self.page.break()
      y = page.cursor - self.lineHeight
      page.addFont(self.font)
    }
    
    var spaceLeft = self.width - line.textWidth
      , left = x
      , wordCount = line.line.length
      , text = line.line.join(' ')
  
    // begin text
    self.page.beginText()
  
    // set fontfamily and -size
    self.page.setFont(self.font.id, self.fontSize)
  
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
        self.page.setWordSpacing(wordSpacing)
    }
  
    // position the text in user space
    self.page.moveTextCursor(left, y)
  
    // print text
    self.page.showText(text)

    // end text
    self.page.endText()
  
    y -= self.lineHeight
  })
  
  return y + self.lineHeight
}