'use strict'

var Document = exports.Document = require('./element/document')
exports.createDocument = function(style) {
  return new Document(style)
}

var TTFFont = exports.TTFFont = require('./element/font/ttf')
exports.createTTFFont = function(src) {
  return new TTFFont(src)
}


var Image = exports.Image = require('./image')
exports.createImage = function(src) {
  return new Image(src)
}

exports.Parser = require('./pdf/parser/document')

var isClient = typeof window !== 'undefined' && !!window.document
// trick browserify
var fs = (require)('fs')
exports.load = function(path, callback) {
  if (isClient) {
    var xhr = new XMLHttpRequest()
    xhr.open('GET', path, true)
    xhr.responseType = 'arraybuffer'

    if (xhr.overrideMimeType) {
      xhr.overrideMimeType('text/plain; charset=x-user-defined')
    } else {
      xhr.setRequestHeader('Accept-Charset', 'x-user-defined')
    }

    xhr.onload = function() {
      if (xhr.status === 200) {
        callback(null, xhr.response)
      } else {
        callback(new Error(xhr.statusText), null)
      }
    }

    xhr.send(null)
  } else {
    fs.readFile(path, callback)
  }
}
