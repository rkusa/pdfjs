'use strict'

var BaseElement = module.exports = function(Node) {
  this.Node = Node
}

BaseElement.prototype.createNode = function(x, y, width) {
  var node = new this.Node(this)
  return node
}
