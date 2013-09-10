module.exports = function(op) {
  var operation = new Operation(op)
  this.contents.push(operation)

  return this
}

var Operation = function(op) {
  this.op = op
}

Operation.prototype.render = function(page, width) {
  page.contents.writeLine(this.op)
}