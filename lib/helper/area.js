var Page  = require('../page')
  , Text  = require('./text')
  , Table = require('./table')

var Area = module.exports = function(page, definition) {
  this.page    = page
  this.height  = 0
  this.content = []
  
  definition.call(this, this)
}

Area.prototype.table = function(options, definition) {
  var args = Array.prototype.slice.call(arguments)
    , definition = args.pop()
    , options = args.pop()
  if (typeof options !== 'object') options = {}
  
  var table = new Table(this.page, this.page.padding.left, options, definition)
  this.height += table.height
  
  this.content.push(table)
  
  return this
}

Area.prototype.text = function(text, options) {
  if (!options) options = {}
  var text = new Text(this.page, this.page.padding.left, text, options)
  this.height += text.height
  
  this.content.push(text)
  
  return this
}

Area.prototype.draw = function(y) {
  var that = this
  this.content.forEach(function(element) {
    y = element.print(y)
  })
}