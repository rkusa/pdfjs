'use strict'

var ForceBreak = module.exports = function() {
  ForceBreak.super_.call(this, require('../pdf/node/forcebreak'))
}

require('../pdf/utils').inherits(ForceBreak, require('./base'))
