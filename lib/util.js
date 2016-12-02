'use strict'

exports.colorToRgb = function(hex) {
  if (!hex) {
    return
  }

  if (typeof hex === 'string') {
    hex = parseInt(hex.replace('#', ''), 16)
  }

  var r = (hex >> 16) / 255
  var g = ((hex >> 8) & 255) / 255
  var b = (hex & 255) / 255

  return [r, g, b]
}
