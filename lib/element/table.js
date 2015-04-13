'use strict'

var TableStyle = require('../style/table')

var Table = module.exports = function(style, opts) {
  Table.super_.call(this, require('../pdf/node/table'))

  this.style    = new TableStyle(style, opts)
  this.children = []

  this.beforeBreakChildren = []
}

require('../pdf/utils').inherits(Table, require('./base'))

var Row = require('./row')
Table.prototype.tr = function(opts) {
  var tr = new Row(this.style.merge(opts))
  this.children.push(tr)
  return tr
}

Table.prototype.beforeBreak = function(fnOrOpts, opts) {
  if (typeof fnOrOpts === 'function') {
    fnOrOpts.opts = this.style.merge(opts)
    this.beforeBreakChildren.push(fnOrOpts)
  } else {
    var tr = new Row(this.style.merge(fnOrOpts))
    this.beforeBreakChildren.push(tr)
    return tr
  }
}
