'use strict'

var BaseElement = module.exports = function(Node) {
  this.Node = Node
}

BaseElement.prototype.createNode = function() {
  var node = new this.Node(this)
  return node
}

BaseElement.prototype.clone = function() {
  return this.createNode()
}
