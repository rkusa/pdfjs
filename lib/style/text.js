'use strict'

var TextStyle = module.exports = function() {
  this.font       = null
  this.color      = 0x000000
  this.textAlign  = 'left'
  this.fontSize   = 11
  this.lineHeight = 1
  this.whiteSpace = 'normal'

  TextStyle.super_.apply(this, arguments)
}

require('../pdf/utils').inherits(TextStyle, require('./base'))
