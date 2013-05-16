var standardFonts, UnicodeToWinAnsi

var AFMFont = module.exports = function(document, id, name) {
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

AFMFont.getFullName = function(name, options) {
  if (!standardFonts[name]) throw new Error('Font ' + name + ' not found/supported.')
  // Todo: Check if style exists
  var style = ''
  if (options.bold === true) style = 'Bold'
  // else if (options.light === true) style = 'Light'
  if (options.italic === true) style += 'Oblique'
  if (style !== '') name += '-' + style
  return name
}

AFMFont.prototype.encode = function(string) {
  var encoded = ''
  for (var i = 0, len = string.length; i < len; ++i) {
    var charHex = string.charCodeAt(i).toString(16)
    if (charHex in UnicodeToWinAnsi) {
      encoded += String.fromCharCode(parseInt(UnicodeToWinAnsi[charHex], 16))
    } else {
      encoded += string[i]
    }
  }
  return encoded
}

AFMFont.prototype.stringWidth = function(string, size) {
  var width = 0
    , scale = size / 1000
  for (var i = 0, len = string.length; i < len; ++i) {
    var charCode = string.charCodeAt(i) // - 32 if non AFM font
    width += this.charWidths[charCode] || 0
  }
  return width * scale
}

AFMFont.prototype.lineHeight = function(size, includeGap) {
  if (includeGap == null) includeGap = false
  var gap = includeGap ? this.lineGap : 0
  return (this.ascender + gap - this.decender) / 1000 * size
}

AFMFont.prototype.toReference = function() {
  return this.object.toReference()
}

standardFonts = {
  'Helvetica': {
    ascender: 718,
    decender: -207,
    lineGap: 231,
    charWidths: [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,null,556,null,222,556,333,1000,556,556,333,1000,667,333,1000,null,611,null,null,222,222,333,333,350,556,1000,333,1000,500,333,944,null,500,500,278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,333,400,584,333,333,333,556,537,278,333,333,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,584,611,556,556,556,556,500,556,500]
  },
  'Helvetica-Bold': {
    ascender: 718,
    decender: -207,
    lineGap: 265,
    charWidths: [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,null,556,null,278,556,500,1000,556,556,333,1000,667,333,1000,null,611,null,null,278,278,500,500,350,556,1000,333,1000,556,333,944,null,500,556,278,333,556,556,556,556,280,556,333,737,370,556,584,333,737,333,400,584,333,333,333,611,556,278,333,333,365,556,834,834,834,611,722,722,722,722,722,722,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,556,556,556,556,556,278,278,278,278,611,611,611,611,611,611,611,584,611,611,611,611,611,556,611,556]
  },
  'Helvetica-Oblique': {
    ascender: 718,
    decender: -207,
    lineGap: 231,
    charWidths: [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,null,556,null,222,556,333,1000,556,556,333,1000,667,333,1000,null,611,null,null,222,222,333,333,350,556,1000,333,1000,500,333,944,null,500,500,278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,333,400,584,333,333,333,556,537,278,333,333,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,584,611,556,556,556,556,500,556,500]
  },
  'Helvetica-BoldOblique': {
    ascender: 718,
    decender: -207,
    lineGap: 265,
    charWidths: [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,null,556,null,278,556,500,1000,556,556,333,1000,667,333,1000,null,611,null,null,278,278,500,500,350,556,1000,333,1000,556,333,944,null,500,556,278,333,556,556,556,556,280,556,333,737,370,556,584,333,737,333,400,584,333,333,333,611,556,278,333,333,365,556,834,834,834,611,722,722,722,722,722,722,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,556,556,556,556,556,278,278,278,278,611,611,611,611,611,611,611,584,611,611,611,611,611,556,611,556]
  }
}

// A mapping of WinAnsi (win-1252) characters to unicode.
// Thanks to https://github.com/prawnpdf/prawn/blob/master/data/encodings/win_ansi.txt

UnicodeToWinAnsi = {
  '20ac': '80',
  '201a': '82',
  '0192': '83',
  '201e': '84',
  '2026': '85',
  '2020': '86',
  '2021': '87',
  '02c6': '88',
  '2030': '89',
  '0160': '8a',
  '2039': '8b',
  '0152': '8c',
  '017d': '8e',
  '2018': '91',
  '2019': '92',
  '201c': '93',
  '201d': '94',
  '2022': '95',
  '2013': '96',
  '2014': '97',
  '02dc': '98',
  '2122': '99',
  '0161': '9a',
  '203a': '9b',
  '0153': '9c',
  '017e': '9e',
  '0178': '9f'
}