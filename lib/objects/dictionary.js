var PDFName = require('./name')

var PDFDictionary = module.exports = function(dictionary) {
  this.dictionary = {}
  if (dictionary) {
    for (var key in dictionary)
      this.add(key, dictionary[key])
  }
}

PDFDictionary.prototype.add = function(key, val) {
  key = new PDFName(key)
  if (typeof val === 'string') val = new PDFName(val)
  this.dictionary[key] = val
}

PDFDictionary.prototype.toString = function() {
  var self = this
  return '<<\n' +
           Object.keys(this.dictionary).map(function(key) {
             return key.toString() + ' ' + self.dictionary[key].toString()
           }).join('\n').replace(/^/gm, '\t') + '\n' +
         '>>'
}

Object.defineProperty(PDFDictionary.prototype, 'length', {
  get: function() {
    return Object.keys(this.dictionary).length
  },
  enumerable: true
})