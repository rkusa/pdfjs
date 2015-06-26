'use strict'

var TableStyle = require('../style/table')

var Row = module.exports = function(style) {
  Row.super_.call(this, require('../pdf/node/row'))

  this.style    = new TableStyle(style)
  this.children = []
}

require('../pdf/utils').inherits(Row, require('./base'))

var Cell = require('./cell')
Row.prototype.td = function(text, opts) {
  if (text && typeof text === 'object') {
    opts = text
    text = undefined
  }

  var td = new Cell(text, this.style.merge(opts))
  this.children.push(td)
  return td
}

Row.prototype.clone = function() {
  var clone = new Row()
  clone.style = this.style
  clone.children = this.children.map(function(child) {
    return child.clone()
  })
  return clone
}
