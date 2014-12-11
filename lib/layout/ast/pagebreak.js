'use strict'

var PageBreakNode = module.exports = function(id) {
  PageBreakNode.super_.call(this)

  this.type = 'PageBreakNode'
  this.id = id
  this.compiled = true
}

require('../utils').inherits(PageBreakNode, require('./base'))

PageBreakNode.prototype.build = function(doc, pages, parent) {
  var p = parent
  while (p.parent) {
    if (hasFunction(p.node, 'end')) {
      pages.write(p.node.end(doc, pages, p.parent))
    }

    p = p.parent
  }

  pages.createPage()

  p = parent
  while (p.parent) {
    if (hasFunction(p.node, 'begin')) {
      pages.write(p.node.begin(doc, pages, p.parent))
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
