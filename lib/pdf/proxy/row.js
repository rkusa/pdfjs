'use strict'

var Row = require('../../element/row')

var RowProxy = module.exports = function(row) {
  this.type = 'RowNode'
  this.row  = row

  this.width = this.widths = null
}

RowProxy.prototype.create = function(idx) {
  var node
  if (typeof this.row === 'function') {
    var row = new Row(this.row.opts)
    this.row(row, idx)
    node = row.createNode()
  } else {
    node = this.row.createNode()
  }

  node.width = this.width
  node.widths = this.widths

  return node
}
