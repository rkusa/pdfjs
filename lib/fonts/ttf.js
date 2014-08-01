var TTFFont = module.exports = require('ttfjs')

var PDFArray  = require('../objects/array')
  , PDFStream = require('../objects/stream')

var embed = TTFFont.Subset.prototype.embed
TTFFont.Subset.prototype.embed = function(doc) {
  embed.call(this)

  var font = this.object
  font.prop('Subtype', 'TrueType')
  font.prop('BaseFont', this.font.fontName)
  font.prop('Encoding', 'MacRomanEncoding')
  doc.objects.push(font)

  // widths array
  var widths = doc.createObject(), metrics = [], codeMap = this.cmap()
  for (var code in codeMap) {
    if (code < 32) continue
    var gid = codeMap[code]
    metrics.push(Math.round(this.font.tables.hmtx.metrics[gid] * this.font.scaleFactor))
  }
  widths.content = new PDFArray(metrics)
  font.prop('Widths', widths.toReference())

  font.prop('FirstChar', 32)
  font.prop('LastChar', metrics.length > (222) ? 225 : metrics.length + 33 - 1)

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
  font.prop('FontDescriptor', descriptor.toReference())

  // unicode map
  var cmap = new PDFStream(doc.createObject())
  cmap.writeLine('/CIDInit /ProcSet findresource begin')
  cmap.writeLine('12 dict begin')
  cmap.writeLine('begincmap')
  cmap.writeLine('/CIDSystemInfo <<')
  cmap.writeLine('  /Registry (Adobe)')
  cmap.writeLine('  /Ordering (UCS)')
  cmap.writeLine('  /Supplement 0')
  cmap.writeLine('>> def')
  cmap.writeLine('/CMapName /Adobe-Identity-UCS def')
  cmap.writeLine('/CMapType 2 def')
  cmap.writeLine('1 begincodespacerange')
  cmap.writeLine('<00><ff>')
  cmap.writeLine('endcodespacerange')

  var codeMap = this.subset, lines = []
  for (var code in codeMap) {
    if (lines.length >= 100) {
      cmap.writeLine(lines.length + ' beginbfchar')
      lines.forEach(function(line) {
        cmap.writeLine(line)
      })
      cmap.writeLine('endbfchar')
      lines = []
    }
    var unicode = ('0000' + codeMap[code].toString(16)).slice(-4)
      , code = (+code).toString(16)
    lines.push('<' + code + '><' + unicode + '>')
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
    , hex = asHex(data)

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
  if (n < 16) return '0' + n.toString(16);
  return n.toString(16);
}

function asHex(ab) {
  var view = new Uint8Array(ab), hex = ''
  for (var i = 0, len = ab.byteLength; i < len; ++i) {
    hex += toHex(view[i])
  }
  return hex
}
