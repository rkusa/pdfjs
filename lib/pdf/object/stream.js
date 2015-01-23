// page 60
// Filters: page 65

var utils = require('../utils')

var PDFStream = module.exports = function(object) {
  object.content = this
  this.object    = object
  this.content   = ''
}

PDFStream.prototype.slice = function(begin, end) {
  this.content = this.content.slice(begin, end)
  this.object.prop('Length', this.content.length - 1)
}

PDFStream.prototype.writeLine = function(str) {
  this.content += str + '\n'
  this.object.prop('Length', this.content.length - 1)
}

PDFStream.prototype.toReference = function() {
  return this.object.toReference()
}

PDFStream.prototype.toString = function() {
  var content = this.content
  if (content instanceof Uint8Array) {
    content = utils.uint8ToString(content) + '\n'
  }

  return 'stream\n' + content + 'endstream'
}
