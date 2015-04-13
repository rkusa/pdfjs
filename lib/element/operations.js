'use strict'

var Operations = module.exports = function() {
  Operations.super_.call(this, require('../pdf/node/operations'))

  this.ops = []
}

require('../pdf/utils').inherits(Operations, require('./base'))

Operations.prototype.op = function() {
  this.ops.push(Array.prototype.slice.call(arguments))
}