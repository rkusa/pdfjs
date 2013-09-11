var PDFReference = module.exports = function(object) {
  this.object = object
}

PDFReference.prototype.toString = function() {
  return this.object.id + ' ' + this.object.rev + ' R'
}