'use strict'

var TableStyle = require('../style/table')

var Cell = module.exports = function(str, style) {
  Cell.super_.call(this, require('../pdf/nodes/cell'))

  if (typeof str === 'object') {
    style = str
    str   = null
  }

  this.style = new TableStyle(style)

  if (str) {
    this.text(str, this.style)
  }
}

require('../pdf/utils').inherits(Cell, require('./container'))

var Table = require('./table')
Cell.prototype.table = function(opts) {
  var table = new Table(this.style.merge(Cell.super_.paddingReset), opts)
  this.children.push(table)
  return table
}
