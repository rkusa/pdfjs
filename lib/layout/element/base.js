'use strict'

var BaseElement = module.exports = function(Node) {
  this.Node = Node
}

BaseElement.prototype.compile = function(x, y, width) {
  var node = new this.Node(this)
  node.compile(x, y, width)
  return node
}
