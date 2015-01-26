'use strict'

var TableStyle = require('../style/table')

var Row = module.exports = function(style) {
  Row.super_.call(this, require('../pdf/nodes/row'))

  this.style    = new TableStyle(style)
  this.children = []
}

require('../pdf/utils').inherits(Row, require('./base'))

var Cell = require('./cell')
Row.prototype.td = function(text, opts) {
  if (typeof text === 'object') {
    opts = text
    text = undefined
  }

  var td = new Cell(text, this.style.merge(opts))
  this.children.push(td)
  return td
}
