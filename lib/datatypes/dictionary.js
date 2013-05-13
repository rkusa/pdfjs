var PDFName = require('./name')

var PDFDictionary = module.exports = function(dictionary) {
  this.dictionary = dictionary || {}
}

PDFDictionary.prototype.add = function(key, val) {
  if (typeof val === 'string') val = new PDFName(val)
  this.dictionary[key] = val
}

PDFDictionary.prototype.toString = function() {
  var self = this
  return '<<\n' +
         Object.keys(this.dictionary).map(function(key) {
           return (new PDFName(key)).toString() + ' ' + self.dictionary[key].toString()
         }).join('\n').replace(/^/gm, '\t') + '\n' +
         '>>'
}