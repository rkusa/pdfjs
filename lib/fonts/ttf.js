'use strict'

var TTFFont = module.exports = require('ttfjs')

var PDFArray      = require('../objects/array')
var PDFStream     = require('../objects/stream')
var PDFDictionary = require('../objects/dictionary')
var PDFString     = require('../objects/string')

var embed = TTFFont.Subset.prototype.embed
TTFFont.Subset.prototype.embed = function(doc) {
  embed.call(this)

  var font = this.object
  font.prop('Subtype', 'Type0')
  font.prop('BaseFont', this.font.fontName)
  font.prop('Encoding', 'Identity-H')
  doc.objects.push(font)

  var descendant = doc.createObject('Font')
  descendant.prop('Subtype', 'CIDFontType2')
  descendant.prop('BaseFont', this.font.fontName)
  descendant.prop('DW', 1000)
  descendant.prop('CIDToGIDMap', 'Identity')
  descendant.prop('CIDSystemInfo', new PDFDictionary({
    'Ordering':   new PDFString('Identity'),
    'Registry':   new PDFString('Adobe'),
    'Supplement': 0
  }))

  font.prop('DescendantFonts', new PDFArray([
    descendant.toReference()
  ]))

  // widths array
  var metrics = [], codeMap = this.cmap()
  for (var code in codeMap) {
    if (code < 32) continue
    var gid = codeMap[code]
    var width = Math.round(this.font.tables.hmtx.metrics[gid] * this.font.scaleFactor)
    metrics.push(code - 31)
    metrics.push(new PDFArray([width]))

  }
  descendant.prop('W', new PDFArray(metrics))

  // font descriptor
  var descriptor = doc.createObject('FontDescriptor')
  descriptor.prop('FontName', this.font.fontName)
  descriptor.prop('Flags', this.font.flags)
  descriptor.prop('FontBBox', new PDFArray(this.font.bbox))
  descriptor.prop('ItalicAngle', this.font.italicAngle)
  descriptor.prop('Ascent', this.font.ascent)
  descriptor.prop('Descent', this.font.descent)
  descriptor.prop('CapHeight', this.font.capHeight)
  descriptor.prop('StemV', this.font.stemV)
  descendant.prop('FontDescriptor', descriptor.toReference())

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

  var mapping = this.subset, lines = []
  for (code in mapping) {
    if (lines.length >= 100) {
      cmap.writeLine(lines.length + ' beginbfchar')
      lines.forEach(function(line) {
        cmap.writeLine(line)
      })
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

  font.prop('ToUnicode', cmap.toReference())

  // font file
  var data = this.save()
  var hex = asHex(data)

  var file = new PDFStream(doc.createObject())
  file.object.prop('Length', hex.length + 1)
  file.object.prop('Length1', data.byteLength)
  file.object.prop('Filter', 'ASCIIHexDecode')
  file.content = hex + '>\n'
  descriptor.prop('FontFile2', file.toReference())
}

Object.defineProperty(TTFFont.Subset.prototype, 'isUsed', {
  enumerable: true,
  get: function() {
    return this.pos > 33
  }
})

TTFFont.Subset.prototype.toReference = function() {
  return this.object.toReference()
}

function toHex(n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function asHex(ab) {
  var view = new Uint8Array(ab), hex = ''
  for (var i = 0, len = ab.byteLength; i < len; ++i) {
    hex += toHex(view[i])
  }
  return hex
}
