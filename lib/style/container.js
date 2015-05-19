'use strict'

var ContainerStyle = module.exports = function(values) {
  this.padding = 20

  var sides = ['Top', 'Right', 'Bottom', 'Left']
  sides.forEach(function(side) {
    var value = null
    Object.defineProperty(this, 'padding' + side, {
      enumerable: true,
      get: function() { return Math.max(0, value || this.padding || 0) },
      set: function(val) { value = val }
    })
  }, this)

  this.width  = this.minWidth  = this.maxWidth  = null
  this.height = this.minHeight = this.maxHeight = null

  ContainerStyle.super_.apply(this, arguments)
}

require('../pdf/utils').inherits(ContainerStyle, require('./text'))

ContainerStyle.reset = {
  padding: 0,
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  height: null
}

Object.defineProperties(ContainerStyle.prototype, {
  innerHeight: {
    enumerable: true,
    get: function() {
      return this.height - this.paddingTop - this.paddingBottom
    },
    set: function() {}
  },
  innerWidth: {
    enumerable: true,
    get: function() {
      return this.width - this.paddingLeft - this.paddingRight
    },
    set: function() {}
  }
})
