'use strict'

var Word = module.exports = function(word, style) {
  Word.super_.call(this, require('../ast/word'))

  if (!style.font) {
    throw TypeError('Cannot create font without specifying a font')
  }

  this.word     = word
  this.style    = style
  this.children = [this]
}

require('../utils').inherits(Word, require('./base'))

Object.defineProperties(Word.prototype, {
  width: {
    enumerable: true,
    get: function() {
      var width = this.children.map(function(word) {
        return this.style.font.stringWidth(word.word, word.style.fontSize)
      }, this).reduce(function(lhs, rhs) {
        return lhs + rhs
      }, 0)

      return this.style.round(width)
    }
  },

  height: {
    enumerable: true,
    get: function() {
      var height = Math.max.apply(Math, this.children.map(function(word) {
        return word.style.font.lineHeight(word.style.fontSize, true) * word.style.lineHeight
      }, this))

      return this.style.round(height)
    }
  },

  spacing: {
    enumerable: true,
    get: function() {
      var last = this.children[this.children.length - 1]
      var spacing = last.style.font.stringWidth(' ', last.style.fontSize)

      return last.style.round(spacing)
    }
  }
})

Word.prototype.toString = function() {
  return this.children.map(function(word) {
    return word.word
  }, this).reduce(function(lhs, rhs) {
    return lhs + rhs
  }, '')
}
