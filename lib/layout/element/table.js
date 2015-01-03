'use strict'

var TableStyle = require('../style/table')

var Table = module.exports = function(style, opts) {
  Table.super_.call(this, require('../pdf/nodes/table'))

  this.style    = new TableStyle(style, opts)
  this.children = []
}

require('../pdf/utils').inherits(Table, require('./base'))

var Row = require('./row')
Table.prototype.tr = function(opts) {
  var tr = new Row(this.style.merge(opts))
  this.children.push(tr)
  return tr
}
