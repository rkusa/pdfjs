'use strict'

var ImageStyle = require('../style/image')

var Image = module.exports = function(img, style, opts) {
  this.uuid = img.uuid
  this.img  = img

  Image.super_.call(this, require('../pdf/nodes/image'))

  this.style = new ImageStyle(style, opts)
}

require('../pdf/utils').inherits(Image, require('./base'))
