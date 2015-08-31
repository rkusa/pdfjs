'use strict'

var PageBreakNode = module.exports = function(id, offset, cause) {
  PageBreakNode.super_.call(this)

  this.type   = 'PageBreakNode'
  this.id     = id
  this.offset = offset
  this.cause  = cause

  this.begun  = []
  this.broken = []
  this.ended  = []
}

require('../utils').inherits(PageBreakNode, require('./base'))

PageBreakNode.prototype.end = function(doc, parent) {
  var parents = [], p = parent
  while (p) {
    parents.unshift(p)
    p = p.parent
  }

  parents.forEach(function(p) {
    if (hasFunction(p.node, 'end') && this.ended.indexOf(p.node) === -1) {
      p.node.end(doc, p.parent)

      this.ended.push(p.node)
    }
  }, this)

  doc.createPage()

  var offset = doc.offset + this.offset
  doc.offset = 0

  parents.forEach(function(p) {
    if (hasFunction(p.node, 'afterBreak') && this.broken.indexOf(p.node) === -1) {
      p.node.afterBreak(doc, p.parent)

      this.broken.push(p.node)
    }
  }, this)

  doc.offset = offset

  parents.forEach(function(p) {
    if (hasFunction(p.node, 'begin') && this.begun.indexOf(p.node) === -1) {
      p.node.begin(doc, p.parent)

      this.begun.push(p.node)
    }
  }, this)

  this.rendered = true
}

function hasFunction(obj, name) {
  return typeof obj[name] === 'function'
}
