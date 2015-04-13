'use strict'

var utils = require('../utils')

var OperationsNode = module.exports = function(ops) {
  OperationsNode.super_.call(this)

  this.type = 'OperationsNode'

  this.ops = ops.ops
}

utils.inherits(OperationsNode, require('./base'))

OperationsNode.prototype.render = function(doc) {
  this.ops.forEach(function(op) {
    doc.write.apply(doc, op)
  })
}
