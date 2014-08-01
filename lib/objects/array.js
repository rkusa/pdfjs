var PDFArray = module.exports = function(array) {
  if (!array) array = []

  array.toString = function() {
    return '[' +
            this.map(function(item) {
              return item.toString()
            }).join(' ') +
           ']'
  }

  return array
}
