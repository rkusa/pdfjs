module.exports = function(array) {
  if (!array) array = []

  array.toString = function() {
    return '[' +
            this.map(function(item) {
              return String(item)
            }).join(' ') +
           ']'
  }

  return array
}
