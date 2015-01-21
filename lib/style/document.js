'use strict'

var DocumentStyle = module.exports = function(values) {
  this.precision = 3
  this.threshold = 64

  DocumentStyle.super_.apply(this, arguments)
}

require('../pdf/utils').inherits(DocumentStyle, require('./container'))
