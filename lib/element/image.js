'use strict'

var ImageStyle = require('../style/image')
var utils = require('../pdf/utils')

var Image = module.exports = function(src, style, opts) {
  this.src = utils.toArrayBuffer(src)

  Image.super_.call(this, require('../pdf/nodes/image'))

  this.style = new ImageStyle(style, opts)
}

require('../pdf/utils').inherits(Image, require('./base'))
