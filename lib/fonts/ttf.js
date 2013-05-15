var fs = require('fs')

var TTFFont = module.exports = function(path) {
  var buf = fs.readFileSync(path)
  
  var offsetSubtable = {
    scalerType:    buf.readUInt32BE(0),
    numTables:     buf.readUInt16BE(4),
    searchRange:   buf.readUInt16BE(6),
    entrySelector: buf.readUInt16BE(8),
    rangeShift:    buf.readUInt16BE(10)
  }
  
  var scalerType = buf.readUInt32BE(0).toString(16)
  if (scalerType !== '74727565' && scalerType !== '10000') {
    throw new Error('Not a TrueType font')
  }
  
  this.tableDirectory = {}
  for (var i = 0; i < offsetSubtable.numTables; ++i) {
    var offset = i * 16
    var table = {
      tag:      buf.toString('ascii', 12 + offset, 16 + offset),
      checkSum: buf.readUInt32BE(16 + offset),
      offset:   buf.readUInt32BE(20 + offset),
      length:   buf.readUInt32BE(24 + offset)
    }
  
    this.tableDirectory[table.tag] = table
  }
  
  this.head = new HeadTable(buf, this)
  this.hhea = new HheaTable(buf, this)
  this.maxp = new MaxpTable(buf, this)
  this.hmtx = new HmtxTable(buf, this)
  this.cmap = new CmapTable(buf, this)
  this.os2  = new Os2Table(buf, this)
  
  this.ascent  = this.os2.ascent  || this.hhea.ascent 
  this.descent = this.os2.descent || this.hhea.descent
  this.lineGap = this.os2.lineGap || this.hhea.lineGap
  
  this.scaleFactor = 1000.0 / this.head.unitsPerEm
  
  this.charWidths = []
  var codeMap = this.cmap.subTable.codeMap
  for (var code in codeMap) {
    if (code < 32) continue
    var gid = codeMap[code]
    this.charWidths.push(Math.round(this.hmtx.metrics[gid].advanceWidth * this.scaleFactor))
  }
}

TTFFont.prototype.stringWidth = function(string, size) {
  var width = 0
    , scale = size / 1000
  for (var i = 0, len = string.length; i < len; ++i) {
    var gid = this.cmap.subTable.codeMap[string.charCodeAt(i) - 32] // - 32 because of non AFM font
    width += gid ? this.hmtx.metrics[gid].advanceWidth : 0
  }
  return width * this.scaleFactor * scale
}

TTFFont.prototype.lineHeight = function(size, includeGap) {
  if (includeGap == null) includeGap = false
  var gap = includeGap ? this.lineGap : 0
  return (this.ascender + gap - this.decender) / 1000 * size
}

var HeadTable = function(buf, font) {
  var offset = font.tableDirectory.head.offset
  this.unitsPerEm = buf.readUInt16BE(offset + 18)
}

var HheaTable = function(buf, font) {
  var offset = font.tableDirectory.hhea.offset
  this.ascent       = buf.readInt16BE(offset + 4)
  this.descent      = buf.readInt16BE(offset + 6)
  this.lineGap      = buf.readInt16BE(offset + 8)
  this.numOfMetrics = buf.readUInt16BE(offset + 34)
}

var MaxpTable = function(buf, font) {
  var offset = font.tableDirectory.maxp.offset
  this.numGlyphs = buf.readUInt16BE(offset + 4)
}

var HmtxTable = function(buf, font) {
  this.metrics = []
  var offset = font.tableDirectory.hmtx.offset
    , i = 0, len = font.hhea.numOfMetrics
  for (; i < len; ++i) {
    this.metrics.push({
      advanceWidth:    buf.readUInt16BE(offset + i * 4),
      // not used
      // leftSideBearing: buf.readInt16BE(2 + offset + i * 4)
    })
  }

  var last = this.metrics[len - 1]
  len += font.maxp.numGlyphs - font.hhea.numOfMetrics
  for (; i < len; ++i) {
    this.metrics.push({
      advanceWidth:    last.advanceWidth,
      // not used
      // leftSideBearing: buf.readInt16BE(offset + i * 4)
    })
  }
}

var CmapTable = function(buf, font) {
  this.offset = font.tableDirectory.cmap.offset
  this.numberSubtables = buf.readUInt16BE(this.offset + 2)
  this.subTable        = null
  
  for (var i = 0; i < this.numberSubtables; ++i) {
    var subTable = new SubTable(this, buf, this.offset + 4 + i * 8)
    if (subTable.isUnicode) {
      subTable.build(buf),
      this.subTable = subTable
      break
    }
  }
}

var SubTable = function(cmap, buf, offset) {
  this.platformID = buf.readUInt16BE(offset)
  this.platformSpecificID = buf.readUInt16BE(offset + 2)
  this.offset = cmap.offset + buf.readUInt32BE(offset + 4)
  this.format = buf.readUInt16BE(this.offset)
  
  this.codeMap = {}
  
  this.isUnicode = //this.format === 4 &&
                 ((this.platformID === 3 // Windows platform-specific encoding
                   && this.platformSpecificID === 1) // http://www.microsoft.com/typography/otspec/name.htm
                || this.platformID === 0) // Unicode platform-specific encoding
}

SubTable.prototype.build = function(buf) {
  switch (this.format) {
    case 4:
      this.length   = buf.readUInt16BE(this.offset + 2)
      this.language = buf.readUInt16BE(this.offset + 4)
  
      var segCount = buf.readUInt16BE(this.offset + 6) / 2
        , glyphIds = []
      
      var glyphIdsOffset = this.offset + (2 * 8 + 2 * 4 * segCount)
      
      var offsetEndCode       = this.offset + 14
        , offsetStartCode     = this.offset + 18 + (segCount - 1) * 2
        , offsetIdDelta       = this.offset + 20 + (segCount - 1) * 4
        , offsetIdRangeOffset = this.offset + 22 + (segCount - 1) * 6
      for (var i = 0; i < segCount; ++i) {
        var endCode       = buf.readUInt16BE(offsetEndCode + i * 2)
          , startCode     = buf.readUInt16BE(offsetStartCode + i * 2)
          , idDelta       = buf.readUInt16BE(offsetIdDelta + i * 2)
          , idRangeOffset = buf.readUInt16BE(offsetIdRangeOffset + i * 2)
        
          // console.log([endCode, startCode, idDelta, idRangeOffset])
          for (var code = startCode; code < endCode; ++code) {
            var id
            if (idRangeOffset === 0) id = code + idDelta
            else id = buf.readUInt16BE((offsetIdRangeOffset + i * 2)
                      + idRangeOffset + 2 * (code - startCode))
            
            this.codeMap[code] = id & 0xFFFF
          }
      }
      break
    default:
      throw new Error('Format ' + this.format + ' not supported')
  }
}

var Os2Table = function(buf, font) {
  if (!font.tableDirectory['OS/2']) return null
  
  var offset = font.tableDirectory['OS/2'].offset
  this.ascender  = buf.readInt16BE(offset + 68)
  this.descender = buf.readInt16BE(offset + 70)
  this.lineGap   = buf.readInt16BE(offset + 72)
}