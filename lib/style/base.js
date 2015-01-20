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
    var F = function(args) {
      return constructor.apply(this, args)
    }
    F.prototype = constructor.prototype

    return new F([this].concat(args))
  } else {
    return this
  }
}

