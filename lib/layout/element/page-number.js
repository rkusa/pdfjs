'use strict'

var Word = require('./word')

var PageNumber = module.exports = function(style) {
  Word.call(this, '0', style)
  Word.super_.call(this, require('../nodes/page-number'))
}

require('../utils').inherits(PageNumber, Word)
