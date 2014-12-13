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
      var hex = (self.str.charCodeAt(i) - 31).toString(16)
      results.push(('0000' + hex).slice(-4))
    }
    return results
  })()).join('') + '>'
}

PDFString.prototype.toString = function() {
  return this.toLiteralString()
}
