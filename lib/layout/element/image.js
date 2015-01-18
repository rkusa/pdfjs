'use strict'

var ImageStyle = require('../style/image')
var utils = require('../pdf/utils')

var Image = module.exports = function(src, style, opts) {
  // GLOBAL[('Buffer').toString()] is used instead of Buffer to trick browserify
  // to not load a Buffer polyfill just for instance testing. The `toString()` part
  // is used to trick eslint to not throw
  var isArrayBuffer = src instanceof ArrayBuffer
  var isBuffer = typeof GLOBAL !== 'undefined' && src instanceof GLOBAL[('Buffer').toString()]
  if (!isArrayBuffer && !isBuffer) {
    throw new TypeError('Image must be provided as either Buffer or Arraybuffer.')
  }

  this.src = src instanceof ArrayBuffer ? src : utils.toArrayBuffer(src)

  Image.super_.call(this, require('../pdf/nodes/image'))

  this.style = new ImageStyle(style, opts)
}

require('../pdf/utils').inherits(Image, require('./base'))
