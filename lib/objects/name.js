var PDFName = module.exports = function(name) {
  if (!name) throw new Error('A Name cannot be undefined')
  
  if (name instanceof PDFName) return name
  name = name.toString()
  
  // white-space characters are not allowed
  if (name.match(/[\x00\x09\x0A\x0C\x0D\x20]/))
    throw new Error('A Name mustn\'t contain white-space characters')

  // delimiter characters are not allowed
  if (name.match(/[\(\)<>\[\]\{\}\/\%]/))
    throw new Error('A Name mustn\'t contain delimiter characters')
  
  this.name = name
}

PDFName.prototype.toString = function() {
  return '/' + this.name
}