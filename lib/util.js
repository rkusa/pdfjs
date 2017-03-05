'use strict'

// Converts a hex color expr. like #123456 into an array [r, g, b],
// where r, g, b are in the range of 0 and 1
exports.colorToRgb = function(hex) {
  if (hex === undefined || hex === null) {
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

exports.rgbEqual = function(lhs, rhs) {
  return lhs && rhs && lhs[0] === rhs[0] && lhs[1] === rhs[1] && lhs[2] === rhs[2]
}