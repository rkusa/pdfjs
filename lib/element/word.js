'use strict'

var unorm = require('unorm')

var Word = module.exports = function(word, style) {
  Word.super_.call(this, require('../pdf/node/word'))

  if (!style.font) {
    throw new TypeError('Text must have a font set or inherited')
  }

  this.word     = unorm.nfc(word)
  this.style    = style
  this.children = [this]
}

require('../pdf/utils').inherits(Word, require('./base'))

Object.defineProperties(Word.prototype, {
  width: {
    enumerable: true,
    get: function() {
      var width = this.children.map(function(word) {
        return this.style.font.stringWidth(word.word, word.style.fontSize)
      }, this).reduce(function(lhs, rhs) {
        return lhs + rhs
      }, 0)

      return width
    }
  },

  height: {
    enumerable: true,
    get: function() {
      var height = Math.max.apply(Math, this.children.map(function(word) {
        return word.style.font.lineHeight(word.style.fontSize, true) * word.style.lineHeight
      }, this))

      return height
    }
  },

  spacing: {
    enumerable: true,
    get: function() {
      var last = this.children[this.children.length - 1]
      var spacing = last.style.font.stringWidth(' ', last.style.fontSize)

      return spacing
    }
  }
})

Word.prototype.clone = function() {
  var clone = new Word(this.word, this.style)
  clone.style = this.style
  clone.children = [clone].concat(this.children.slice(1).map(function(child) {
    return child.clone()
  }))
  return clone
}

Word.prototype.toString = function() {
  return this.children.map(function(word) {
    return word.word
  }, this).reduce(function(lhs, rhs) {
    return lhs + rhs
  }, '')
}
