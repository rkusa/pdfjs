'use strict'

var SIDES = ['Top', 'Right', 'Bottom', 'Left']

var BoxStyle = module.exports = function() {
  this.backgroundColor = null
  this.x = null
  this.y = null
  this.overflow = 'visible'

  this.borderWidth = 0
  this.borderColor = 0x000000
  SIDES.forEach(function(side) {
    this['border' + side + 'Width'] = null
    this['border' + side + 'Color'] = null
  }, this)

  BoxStyle.super_.apply(this, arguments)
}

require('../pdf/utils').inherits(BoxStyle, require('./container'))

SIDES.forEach(function(side) {
  BoxStyle.prototype['getBorder' + side + 'Width'] = function() {
    var value = this['border' + side + 'Width']
    return Math.max(0, value != null ? value : this.borderWidth || 0)
  }

  BoxStyle.prototype['getBorder' + side + 'Color'] = function() {
    var value = this['border' + side + 'Color']
    return value != null ? value : this.borderColor || 0x000000
  }
})
