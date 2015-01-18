'use strict'

var BoxStyle = require('../style/box')

var Box = module.exports = function(style, opts) {
  Box.super_.call(this, require('../pdf/nodes/box'))

  this.style    = new BoxStyle(style, opts)
  this.children = []
}

require('../pdf/utils').inherits(Box, require('./base'))

var Text = require('./text')
Box.prototype.createText = function(opts) {
  var text = new Text(this.style.merge(opts))
  this.children.push(text)
  return text
}
