'use strict'

var BaseStyle = module.exports = function() {
  this.precision = 3

  var args = Array.prototype.slice.call(arguments)
  if (args.length) {
    args.forEach(function(values) {
      for (var key in values) {
        if (key in this) {
          this[key] = values[key]
        }
      }
    }, this)
  }

  Object.freeze(this)
}

BaseStyle.prototype.merge = function(values) {
  var changed = false
  for (var key in values) {
    if (key in this && this[key] !== values[key]) {
      changed = true
      break
    }
  }

  if (changed) {
    return new this.constructor(this, values)
  } else {
    return this
  }
}

BaseStyle.prototype.round = function(n) {
  var b = Math.pow(10, this.precision)
  return Math.round(n * b) / b
}
