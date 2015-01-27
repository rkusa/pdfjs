'use strict'

var BoxStyle = module.exports = function() {
  this.backgroundColor = null
  this.x = null
  this.y = null
  this.minHeight = null

  var sides = ['Top', 'Right', 'Bottom', 'Left']

  this.borderWidth = 0
  sides.forEach(function(side) {
    var value = null
    Object.defineProperty(this, 'border' + side + 'Width', {
      enumerable: true,
      get: function() { return Math.max(0, value != null ? value : this.borderWidth || 0) },
      set: function(val) { value = val }
    })
  }, this)

  this.borderColor = 0x000000
  sides.forEach(function(side) {
    var value = null
    Object.defineProperty(this, 'border' + side + 'Color', {
      enumerable: true,
      get: function() { return value != null ? value : this.borderColor || 0x000000 },
      set: function(val) { value = val }
    })
  }, this)

  BoxStyle.super_.apply(this, arguments)
}

require('../pdf/utils').inherits(BoxStyle, require('./container'))
