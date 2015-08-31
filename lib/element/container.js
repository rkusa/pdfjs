'use strict'

var ContainerStyle = require('../style/container')

var Container = module.exports = function(Node) {
  Container.super_.call(this, Node)

  this.children = []
}

require('../pdf/utils').inherits(Container, require('./base'))

var Text = require('./text')
Container.prototype.text = function(text, opts) {
  if (text && typeof text === 'object') {
    opts = text
    text = undefined
  }

  var child = new Text(text, this.style.merge(opts))
  this.children.push(child)
  return child
}

var Box = require('./box')
Container.prototype.box = function(opts) {
  var box = new Box(this.style.merge(ContainerStyle.reset), opts)
  this.children.push(box)
  return box
}

var Table = require('./table')
Container.prototype.table = function(opts) {
  var table = new Table(this.style.merge(ContainerStyle.reset), opts)
  this.children.push(table)
  return table
}

var Image = require('./image')
Container.prototype.image = function(img, opts) {
  var image = new Image(img, opts)
  this.children.push(image)
  return image
}

var Operations = require('./operations')
Container.prototype.ops = function() {
  var ops = new Operations()
  this.children.push(ops)
  return ops
}

var ForceBreak = require('./forcebreak')
Container.prototype.pageBreak = function() {
  this.children.push(new ForceBreak())
  return this
}
