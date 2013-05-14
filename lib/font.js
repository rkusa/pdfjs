var standardFonts

var Font = module.exports = function(document, id, name) {
  if (!standardFonts[name]) throw new Error('Font ' + name + ' not found/supported.')
  
  this.id = id
  
  this.ascender   = standardFonts[name].ascender
  this.decender   = standardFonts[name].decender
  this.lineGap    = standardFonts[name].lineGap
  this.charWidths = standardFonts[name].charWidths
  
  this.object = document.createObject('Font')
  this.object.addProperty('Subtype', 'Type1')
  this.object.addProperty('BaseFont', name)
  this.object.addProperty('Encoding', 'WinAnsiEncoding')
}

Font.prototype.stringWidth = function(string, size) {
  var width = 0
    , scale = size / 1000
  for (var i = 0, len = string.length; i < len; ++i) {
    var charCode = string.charCodeAt(i) // - 32 if non AFM font
    width += this.charWidths[charCode] || 0
  }
  return width * scale
}

Font.prototype.lineHeight = function(size, includeGap) {
  if (includeGap == null) includeGap = false
  var gap = includeGap ? this.lineGap : 0
  return (this.ascender + gap - this.decender) / 1000 * size
}

Font.prototype.toReference = function() {
  return this.object.toReference()
}

standardFonts = {
  'Helvetica': {
    'ascender':718,
    'decender':-207,
    'lineGap':231,
    'charWidths': [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,null,556,null,222,556,333,1000,556,556,333,1000,667,333,1000,null,611,null,null,222,222,333,333,350,556,1000,333,1000,500,333,944,null,500,500,278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,333,400,584,333,333,333,556,537,278,333,333,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,584,611,556,556,556,556,500,556,500]
  }
}