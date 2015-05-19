'use strict'

var DocumentStyle = require('../style/document')
var PDF = require('../pdf')

var Document = module.exports = function(opts) {
  Document.super_.call(this, require('../pdf/node/document'))

  opts        = opts || {}
  opts.width  = opts.width  || 595.296
  opts.height = opts.height || 841.896

  this.style   = new DocumentStyle(opts)
  this._header = null
  this._footer = null
}

require('../pdf/utils').inherits(Document, require('./container'))

var Box = require('./box')

Document.prototype.header = function(opts) {
  if (this._header) {
    return this._header
  }

  if (opts && !opts.width) {
    opts.width = '100%'
  }

  this._header = new Box(this.style.merge(DocumentStyle.super_.reset), opts)
  return this._header
}

Document.prototype.footer = function(opts) {
  if (this._footer) {
    return this._footer
  }

  if (opts && !opts.width) {
    opts.width = '100%'
  }

  this._footer = new Box(this.style.merge(DocumentStyle.super_.reset), opts)
  return this._footer
}

Document.prototype.render = function() {
  return new PDF(this.createNode(this))
}
