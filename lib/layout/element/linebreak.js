'use strict'

var LineBreak = module.exports = function(style) {
  LineBreak.super_.call(this, require('../ast/linebreak'))

  this.style = style
}

require('../utils').inherits(LineBreak, require('./base'))

Object.defineProperties(LineBreak.prototype, {
  width: {
    enumerable: true,
    get: function() {
      return 0
    }
  },

  height: {
    enumerable: true,
    get: function() {
      var height = this.style.font.lineHeight(this.style.fontSize, true) * this.style.lineHeight

      return this.style.round(height)
    }
  },

  spacing: {
    enumerable: true,
    get: function() {
      return 0
    }
  }
})
