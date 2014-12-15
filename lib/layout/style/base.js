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

BaseStyle.prototype.merge = function() {
  var changed = false

  var args = Array.prototype.slice.call(arguments)
  if (args.length) {
    args.forEach(function(values) {
      for (var key in values) {
        if (key in this && this[key] !== values[key]) {
          changed = true
          break
        }
      }
    }, this)
  }

  if (changed) {
    var constructor = this.constructor
    function F(args) {
      return constructor.apply(this, args)
    }
    F.prototype = constructor.prototype

    return new F([this].concat(args))
  } else {
    return this
  }
}

BaseStyle.prototype.round = function(n) {
  var b = Math.pow(10, this.precision)
  return Math.round(n * b) / b
}
