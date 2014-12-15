'use strict'

var ContainerStyle = require('../style/container')
var PDF = require('../pdf')

var Document = module.exports = function(opts) {
  Document.super_.call(this, require('../pdf/nodes/document'))

  opts        = opts || {}
  opts.width  = opts.width  || 612
  opts.height = opts.height || 792

  this.style    = new ContainerStyle(opts)
  this.children = []
}

require('../pdf/utils').inherits(Document, require('./base'))

var Text = require('./text')
Document.prototype.createText = function(opts) {
  var text = new Text(this.style.merge(opts))
  this.children.push(text)
  return text
}

var Box = require('./box')
Document.prototype.createBox = function(opts) {
  var box = new Box(this.style.merge(ContainerStyle.paddingReset), opts)
  this.children.push(box)
  return box
}

Document.prototype.render = function() {
  return new PDF(this.createNode(this))
}
