'use strict'

var DocumentNode = module.exports = function(document) {
  this.type = 'DocumentNode'
  this.allowBreak = false

  this.document = document
  this.children = this.document.children.map(function(child) {
    return child.createNode()
  })
}

DocumentNode.prototype.compile = function() {
  this.width  = this.document.style.width
  this.height = this.document.style.height

  var paddingLeft  = this.document.style.paddingLeft || this.document.style.padding || 0
  var paddingTop   = (this.document.style.paddingTop || this.document.style.padding || 0)
  var paddingRight = (this.document.style.paddingRight || this.document.style.padding || 0)

  var x = paddingLeft
  var y = this.height - paddingTop

  var width = this.width - x - paddingRight
  this.children.forEach(function(child) {
    child.compile(x, y, width)
    y -= child.height
  }, this)
}
