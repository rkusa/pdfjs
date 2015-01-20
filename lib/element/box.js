'use strict'

var BoxStyle = require('../style/box')

var Box = module.exports = function(style, opts) {
  Box.super_.call(this, require('../pdf/nodes/box'))

  this.style = new BoxStyle(style, opts)
}

require('../pdf/utils').inherits(Box, require('./container'))
