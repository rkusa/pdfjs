'use strict'

var LineBreak = module.exports = function(style) {
  LineBreak.super_.call(this, require('../pdf/node/linebreak'))

  this.style = style
}

require('../pdf/utils').inherits(LineBreak, require('./base'))

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

      return height
    }
  },

  spacing: {
    enumerable: true,
    get: function() {
      return 0
    }
  }
})

LineBreak.prototype.clone = function() {
  return new LineBreak(this.style)
}
