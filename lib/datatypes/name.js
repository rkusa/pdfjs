var PDFName = module.exports = function(name) {
  this.name = name
}

PDFName.prototype.toString = function() {
  return '/' + this.name
}