// page 60
// Filters: page 65

var PDFStream = module.exports = function(object) {
  object.content = this
  this.object    = object
  this.content   = []
  this.size      = 0
}

PDFStream.prototype.slice = function(begin, end) {
  this.content = this.content.slice(begin, end)

  this.object.prop('Length', this.content.map(function(line) {
    return line.length + 1 // \n
  }).filter(function(lhs, rhs) {
    return lhs + rhs
  }, 0))
}

PDFStream.prototype.writeLine = function(str) {
  this.content.push(str)
  this.object.prop('Length', (this.size += str.length))
}

PDFStream.prototype.toReference = function() {
  return this.object.toReference()
}

PDFStream.prototype.toString = function() {
  return 'stream\n' +
         (Array.isArray(this.content) ? (this.content.join('\n') + '\n') : this.content) +
         'endstream'

}
