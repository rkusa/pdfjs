'use strict'

var TableStyle = module.exports = function() {
  this.tableLayout = 'fixed'
  this.widths = []

  TableStyle.super_.apply(this, arguments)
}

require('../pdf/utils').inherits(TableStyle, require('./box'))
