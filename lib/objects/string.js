var PDFString = module.exports = function(str) {
  this.str = str
}

PDFString.prototype.toLiteralString = function() {
  return '(' + this.str.replace(/\\/g, '\\\\')
                       .replace(/\(/g, '\\(')
                       .replace(/\)/g, '\\)') + ')'
}

PDFString.prototype.toHexString = function() {
  var self = this
  return '<' + ((function() {
    var results = []
    for (var i = 0, len = self.str.length; i < len; ++i) {
      results.push(self.str.charCodeAt(i).toString(16))
    }
    return results
  })()).join('') + '>'
}

PDFString.prototype.toString = function() {
  return this.toHexString()
}