'use strict'

var TextStyle = require('../style/text')

var Text = module.exports = function(style) {
  Text.super_.call(this, require('../ast/text'))

  this.style    = new TextStyle(style)
  this.children = []
}

require('../utils').inherits(Text, require('./base'))

var LineBreaker = require('linebreak')
var Word        = require('./word')
var LineBreak   = require('./linebreak')

Text.prototype.add = function(str, opts, append) {
  var style    = this.style.merge(opts)
  var last     = this.children[this.children.length - 1]
  var appendTo = append && last.children ? last : this

  var breaker = new LineBreaker(str)
  var last = 0, bk

  while (bk = breaker.nextBreak()) {
    // get the string between the last break and this one
    var word = str.slice(last, bk.position)
    last = bk.position

    // remove trailing whitespaces if white-space style is set to normal
    if (style.whiteSpace === 'normal') {
      word = word.replace(/^\s+/, '').replace(/\s+$/, '')
    }

    // remove newline characters
    if (bk.required) {
      word = word.replace(/(\r\n|\n|\r)/, '')
    }

    if (word.length) {
      if (!appendTo.children) console.log(appendTo)
      appendTo.children.push(new Word(word, style))
    }

    appendTo = this

    // add linebreak
    if (bk.required) {
      this.children.push(new LineBreak(style))
    }
  }

  return this
}

Text.prototype.addLine = function(str, opts) {
  return this.add(str + '\n', opts)
}

Text.prototype.append = function(str, opts) {
  return this.add(str, opts, true)
}

