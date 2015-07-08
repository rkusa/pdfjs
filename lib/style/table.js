'use strict'

var DIRECTIONS = ['Vertical', 'Horizontal']
var SIDES = ['Top', 'Right', 'Bottom', 'Left']

var TableStyle = module.exports = function() {
  this.tableLayout = 'fixed'
  this.widths = []
  this.colspan = 1
  this.headerRows = 0
  this.backgroundColor = null
  this.borderWidth = 0
  this.borderColor = 0x000000
  this.overflow = 'visible'

  DIRECTIONS.forEach(function(direction) {
    this['border' + direction + 'Width'] = null
    this[ 'border' + direction + 'Color'] = null
  }, this)

  SIDES.forEach(function(side) {
    this['border' + side + 'Width'] = null
    this['border' + side + 'Color'] = null
  }, this)

  TableStyle.super_.apply(this, arguments)
}

require('../pdf/utils').inherits(TableStyle, require('./container'))

DIRECTIONS.forEach(function(direction) {
  TableStyle.prototype['getBorder' + direction + 'Width'] = function() {
    var value = this['border' + direction + 'Width']
    return Math.max(0, value != null ? value : (this.borderWidth || 0))
  }

  TableStyle.prototype['getBorder' + direction + 'Color'] = function() {
    var value = this['border' + direction + 'Color']
    return value != null ? value : (this.borderColor || 0x000000)
  }
})

SIDES.forEach(function(side) {
  var direction = side === 'Right' || side === 'Left' ? 'Vertical' : 'Horizontal'

  TableStyle.prototype['getBorder' + side + 'Width'] = function() {
    var value = this['border' + side + 'Width']
    return Math.max(0, value !== null ? value : this['border' + direction + 'Width'] || this.borderWidth || 0)
  }

  TableStyle.prototype['getBorder' + side + 'Color'] = function() {
    var value = this['border' + side + 'Color']
    return value != null ? value : (this['border' + direction + 'Color'] || this.borderColor || 0x000000)
  }
})

TableStyle.reset = {
  colspan: 1,
  allowBreak: false,
  // height: null
}
