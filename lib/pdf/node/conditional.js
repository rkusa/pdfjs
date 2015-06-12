var ConditionalNode = module.exports = function(nodes, condition) {
  ConditionalNode.super_.call(this)

  this.type = 'ConditionalNode'

  this.children  = nodes
  this.condition = condition
}

require('../utils').inherits(ConditionalNode, require('./base'))

Object.defineProperties(ConditionalNode.prototype, {
  height: {
    enumerable: true,
    get: function() {
      return this.children
          .map(function(child) { return child.height })
          .reduce(function(lhs, rhs) { return lhs + rhs }, 0)
    },
    set: function() {} // noop
  },
  x: {
    enumerable: true,
    get: function() { return this.children[0] && this.children[0].x },
    set: function() {} // noop
  },
  y: {
    enumerable: true,
    get: function() { return this.children[0] && this.children[0].y },
    set: function() {} // noop
  }
})

ConditionalNode.prototype.valid = function(parent) {
  return this.condition(parent)
}

ConditionalNode.prototype.clone = function() {
  return new ConditionalNode(this.children.map(function(child) {
    return child.clone()
  }), this.condition)
}
