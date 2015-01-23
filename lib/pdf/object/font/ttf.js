'use strict'

var PDFObject     = require('../object')
var PDFArray      = require('../array')
var PDFStream     = require('../stream')
var PDFDictionary = require('../dictionary')
var PDFString     = require('../string')
var PDFName       = require('../name')

var utils = require('../../utils')

var TTFFont = module.exports = function(id, font) {
  this.alias = new PDFName('F' + id)

  this.font = font
  this.subset = this.font.subset()
  this.subset.use(' ')

  // font descriptor
  this.descriptor = new PDFObject('FontDescriptor')
  this.descriptor.prop('FontName', this.font.ttf.fontName)
  this.descriptor.prop('Flags', this.font.ttf.flags)
  this.descriptor.prop('FontBBox', new PDFArray(this.font.ttf.bbox))
  this.descriptor.prop('ItalicAngle', this.font.ttf.italicAngle)
  this.descriptor.prop('Ascent', this.font.ttf.ascent)
  this.descriptor.prop('Descent', this.font.ttf.descent)
  this.descriptor.prop('CapHeight', this.font.ttf.capHeight)
  this.descriptor.prop('StemV', this.font.ttf.stemV)

  this.descendant = new PDFObject('Font')
  this.descendant.prop('Subtype', 'CIDFontType2')
  this.descendant.prop('BaseFont', this.font.ttf.fontName)
  this.descendant.prop('DW', 1000)
  this.descendant.prop('CIDToGIDMap', 'Identity')
  this.descendant.prop('CIDSystemInfo', new PDFDictionary({
    'Ordering':   new PDFString('Identity'),
    'Registry':   new PDFString('Adobe'),
    'Supplement': 0
  }))
  this.descendant.prop('FontDescriptor', this.descriptor.toReference())

  PDFObject.call(this, 'Font')
  this.prop('Subtype', 'Type0')
  this.prop('BaseFont', this.font.ttf.fontName)
  this.prop('Encoding', 'Identity-H')
  this.prop('DescendantFonts', new PDFArray([
    this.descendant.toReference()
  ]))
}

utils.inherits(TTFFont, PDFObject)

TTFFont.prototype.encode = function(str) {
  this.subset.use(str)
  return this.subset.encode(str)
}

TTFFont.prototype.embed = function(doc) {
  this.subset.embed()

  // widths array
  var metrics = [], codeMap = this.subset.cmap()
  for (var code in codeMap) {
    if (code < 32) continue
    var gid = codeMap[code]
    var width = Math.round(this.font.ttf.tables.hmtx.metrics[gid] * this.font.ttf.scaleFactor)
    metrics.push(code - 31)
    metrics.push(new PDFArray([width]))
  }

  this.descendant.prop('W', new PDFArray(metrics))

  // unicode map
  var cmap = new PDFStream(doc.createObject())
  cmap.writeLine('/CIDInit /ProcSet findresource begin')
  cmap.writeLine('12 dict begin')
  cmap.writeLine('begincmap')
  cmap.writeLine('/CIDSystemInfo <<')
  cmap.writeLine('  /Registry (Adobe)')
  cmap.writeLine('  /Ordering (Identity)')
  cmap.writeLine('  /Supplement 0')
  cmap.writeLine('>> def')
  cmap.writeLine('/CMapName /Identity-H')
  cmap.writeLine('/CMapType 2 def')
  cmap.writeLine('1 begincodespacerange')
  cmap.writeLine('<0000><ffff>')
  cmap.writeLine('endcodespacerange')

  var mapping = this.subset.subset, lines = []
  for (code in mapping) {
    if (lines.length >= 100) {
      cmap.writeLine(lines.length + ' beginbfchar')
      for (var i = 0; i < lines.length; ++i) {
        cmap.writeLine(lines[i])
      }
      cmap.writeLine('endbfchar')
      lines = []
    }

    lines.push(
      '<' + ('0000' + (+code - 31).toString(16)).slice(-4) + '>' + // cid
      '<' + ('0000' + mapping[code].toString(16)).slice(-4) + '>'  // gid
    )
  }

  if (lines.length) {
    cmap.writeLine(lines.length + ' beginbfchar')
    lines.forEach(function(line) {
      cmap.writeLine(line)
    })
    cmap.writeLine('endbfchar')
  }

  cmap.writeLine('endcmap')
  cmap.writeLine('CMapName currentdict /CMap defineresource pop')
  cmap.writeLine('end')
  cmap.writeLine('end')

  this.prop('ToUnicode', cmap.toReference())

  // font file
  var data = this.subset.save()
  var hex = utils.asHex(data)

  var file = new PDFStream(doc.createObject())
  file.object.prop('Length', hex.length + 1)
  file.object.prop('Length1', data.byteLength)
  file.object.prop('Filter', 'ASCIIHexDecode')
  file.content = hex + '>\n'

  this.descriptor.prop('FontFile2', file.toReference())

  doc.addObject(this)
  doc.addObject(this.descriptor)
  doc.addObject(this.descendant)
}
