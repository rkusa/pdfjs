'use strict'

var ContainerStyle = module.exports = function(values) {
  this.padding    = 20
  this.paddingTop = this.paddingRight = this.paddingBottom = this.paddingLeft = null

  this.width  = this.minWidth  = this.maxWidth  = null
  this.height = this.minHeight = this.maxHeight = null

  ContainerStyle.super_.apply(this, arguments)
}

require('../utils').inherits(ContainerStyle, require('./text'))
