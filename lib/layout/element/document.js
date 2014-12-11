'use strict'

var ContainerStyle = require('../style/container')

var Document = module.exports = function(opts) {
  Document.super_.call(this, require('../ast/document'))

  opts        = opts || {}
  opts.width  = opts.width  || 612
  opts.height = opts.height || 792

  this.style    = new ContainerStyle(opts)
  this.children = []
}

require('../utils').inherits(Document, require('./base'))

var Text = require('./text')
Document.prototype.createText = function(opts) {
  var text = new Text(this.style.merge(opts))
  this.children.push(text)
  return text
}

Document.prototype.compile = function() {
  var node = this.createNode()
  node.compile()
  return node
}