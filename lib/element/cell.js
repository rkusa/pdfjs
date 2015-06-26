'use strict'

var TableStyle = require('../style/table')

var Cell = module.exports = function(str, style) {
  Cell.super_.call(this, require('../pdf/node/cell'))

  this.style = new TableStyle(style)

  if (str !== undefined && str !== null) {
    this.text(str, this.style)
  }
}

require('../pdf/utils').inherits(Cell, require('./container'))

var Table = require('./table')
Cell.prototype.table = function(opts) {
  var table = new Table(this.style.merge(TableStyle.reset), opts)
  this.children.push(table)
  return table
}

Cell.prototype.clone = function() {
  var clone = new Cell()
  clone.style = this.style
  clone.children = this.children.map(function(child) {
    return child.clone()
  })
  return clone
}
