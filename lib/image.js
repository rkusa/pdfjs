'use strict'

var utils = require('./pdf/utils')
var uuid  = require('node-uuid')

var Image = module.exports = function(src) {
  this.uuid = uuid.v4()
  this.src  = utils.toArrayBuffer(src)
}
