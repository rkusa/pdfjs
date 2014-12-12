'use strict'

var Word = require('./word')

var PageCount = module.exports = function(style) {
  Word.call(this, '0', style)
  Word.super_.call(this, require('../nodes/page-count'))
}

require('../utils').inherits(PageCount, Word)
