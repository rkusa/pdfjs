'use strict'

var TableStyle = require('../style/table')

var Row = module.exports = function(style) {
  Row.super_.call(this, require('../pdf/nodes/row'))

  this.style    = new TableStyle(style)
  this.children = []
}

require('../pdf/utils').inherits(Row, require('./base'))

var Cell = require('./cell')
Row.prototype.td = function(str, opts) {
  if (typeof str === 'object') {
    opts = str
    str = null
  }

  var td = new Cell(str, this.style.merge(opts))
  this.children.push(td)
  return td
}
