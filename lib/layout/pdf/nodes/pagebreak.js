'use strict'

var PageBreakNode = module.exports = function(id, offset) {
  PageBreakNode.super_.call(this)

  this.type     = 'PageBreakNode'
  this.id       = id
  this.offset   = offset
  this.computed = true
  this.arranged = true
}

require('../utils').inherits(PageBreakNode, require('./base'))

PageBreakNode.prototype.render = function(doc, parent) {
  var parents = [], p = parent
  while (p.parent) {
    parents.unshift(p)
    p = p.parent
  }

  parents.forEach(function(p) {
    if (hasFunction(p.node, 'end')) {
      p.node.end(doc, p.parent)
    }
  })

  doc.createPage()
  doc.offset += this.offset

  parents.forEach(function(p) {
    if (hasFunction(p.node, 'begin')) {
      p.node.begin(doc, p.parent)
    }
  })
}

function hasFunction(obj, name) {
  return typeof obj[name] === 'function'
}

function hasChildren(obj) {
  return obj.children && Array.isArray(obj.children)
}
