'use strict'

var BoxStyle = require('../style/box')

var Box = module.exports = function(style, opts) {
  Box.super_.call(this, require('../pdf/node/box'))

  this.style = new BoxStyle(style, opts)
}

require('../pdf/utils').inherits(Box, require('./container'))

Box.prototype.clone = function() {
  var clone = new Box()
  clone.style = this.style
  clone.children = this.children.map(function(child) {
    return child.clone()
  })
  return clone
}
