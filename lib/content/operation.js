var Operation = module.exports = function(operation) {
  this.operation = operation
}

Operation.prototype.embed = function(page) {
  page.contents.writeLine(this.operation)
}