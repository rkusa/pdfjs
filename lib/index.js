'use strict'

exports.Document = require('./document')
exports.Font = require('./font/otf')

exports.Image = require('./image/image')

exports.ExternalDocument = require('./external')

exports.mm = 0.0393700787 * 72
exports.cm = exports.mm * 10
