'use strict'

var utils = require('../utils')

var OperationsNode = module.exports = function(ops) {
  OperationsNode.super_.call(this)

  this.type = 'OperationsNode'

  this.height = this.width = 0
  this.ops = ops.ops
}

utils.inherits(OperationsNode, require('./base'))

OperationsNode.prototype._compute = function(cursor) {
  this.ops.forEach(function(op) {
    if (typeof op === 'function') {
      op.x = cursor.x
      op.y = cursor.y
    }
  })
}

OperationsNode.prototype.render = function(doc) {
  this.ops.forEach(function(op) {
    if (typeof op === 'function') {
      var args = op(op.x, op.y)
      if (!Array.isArray(args)) {
        args = [args]
      }
    } else {
      args = op
    }

    doc.write.apply(doc, args)
  })
}
