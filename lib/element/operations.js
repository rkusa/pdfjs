'use strict'

var Operations = module.exports = function() {
  Operations.super_.call(this, require('../pdf/node/operations'))

  this.ops = []
}

require('../pdf/utils').inherits(Operations, require('./base'))

Operations.prototype.op = function(fn) {
  if (fn && typeof fn === 'function') {
    this.ops.push(fn)
  } else {
    this.ops.push(Array.prototype.slice.call(arguments))
  }
}

Operations.prototype.clone = function() {
  var clone = new Operations
  clone.ops = this.ops.slice()
  return clone
}
