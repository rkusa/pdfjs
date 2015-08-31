'use strict'

var utils = require('../utils')

var ForceBreakNode = module.exports = function() {
  ForceBreakNode.super_.call(this)

  this.type = 'ForceBreakNode'
  this.valid = false
}

utils.inherits(ForceBreakNode, require('./base'))
