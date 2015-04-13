'use strict'

var TableStyle = module.exports = function() {
  this.tableLayout = 'fixed'
  this.widths = []
  this.colspan = 1
  this.headerRows = 0
  this.backgroundColor = null
  this.borderWidth = 0
  this.borderColor = 0x000000

  var directions = ['Vertical', 'Horizontal']

  directions.forEach(function(direction) {
    var value = null
    Object.defineProperty(this, 'border' + direction + 'Width', {
      enumerable: true,
      get: function() { return Math.max(0, value != null ? value : this.borderWidth || 0) },
      set: function(val) { value = val }
    })
  }, this)

  directions.forEach(function(direction) {
    var value = null
    Object.defineProperty(this, 'border' + direction + 'Color', {
      enumerable: true,
      get: function() { return value != null ? value : this.borderColor || 0x000000 },
      set: function(val) { value = val }
    })
  }, this)

  var sides = ['Top', 'Right', 'Bottom', 'Left']

  sides.forEach(function(side) {
    var value = null
    var direction = side === 'Right' || side === 'Left' ? 'Vertical' : 'Horizontal'
    var directionProperty = 'border' + direction + 'Width'
    Object.defineProperty(this, 'border' + side + 'Width', {
      enumerable: true,
      get: function() { return Math.max(0, value !== null ? value : this[directionProperty] || this.borderWidth || 0) },
      set: function(val) { value = val }
    })
  }, this)

  sides.forEach(function(side) {
    var value = null
    var direction = side === 'Right' || side === 'Left' ? 'Vertical' : 'Horizontal'
    var directionProperty = 'border' + direction + 'Color'
    Object.defineProperty(this, 'border' + side + 'Color', {
      enumerable: true,
      get: function() { return value != null ? value : this[directionProperty] || this.borderColor || 0x000000 },
      set: function(val) { value = val }
    })
  }, this)

  TableStyle.super_.apply(this, arguments)
}

require('../pdf/utils').inherits(TableStyle, require('./container'))

TableStyle.reset = {
  colspan: 1,
  allowBreak: false
}
