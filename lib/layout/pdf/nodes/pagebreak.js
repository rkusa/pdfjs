'use strict'

var PageBreakNode = module.exports = function(id) {
  PageBreakNode.super_.call(this)

  this.type = 'PageBreakNode'
  this.id = id
  this.compiled = true
}

require('../utils').inherits(PageBreakNode, require('./base'))

PageBreakNode.prototype.render = function(doc, parent) {
  var p = parent
  while (p.parent) {
    if (hasFunction(p.node, 'end')) {
      doc.write(p.node.end(doc, p.parent))
    }

    p = p.parent
  }

  doc.createPage()

  p = parent
  while (p.parent) {
    if (hasFunction(p.node, 'begin')) {
      doc.write(p.node.begin(doc, p.parent))
    }

    p = p.parent
  }

  return []
}

function hasFunction(obj, name) {
  return typeof obj[name] === 'function'
}

function hasChildren(obj) {
  return obj.children && Array.isArray(obj.children)
}
