'use strict'

var ImageStyle = module.exports = function() {
  this.width = null
  this.maxWidth = null
  this.height = null
  this.align = 'left'
  this.x = null
  this.y = null
  this.wrap = true

  ImageStyle.super_.apply(this, arguments)
}

require('../pdf/utils').inherits(ImageStyle, require('./base'))
