const fs = require('fs')
const path = require('path')

// thanks to https://github.com/prawnpdf/prawn
WIN_ANSI_CHARACTERS = fs.readFileSync(
  path.join(__dirname, 'winansi_characters.txt'),
  'utf8'
).split(/\s+/)

fs.readFile(path.join(__dirname, 'Helvetica.afm'), 'utf8', function(err, data) {
  if (err) {
    throw err
  }

  const properties = {}
  const glyphWidths = {}

  const lines = data.split('\r\n')
  for (let i = 0; i < lines.length; ++i) {
    const line = lines[i]
    const match = line.match(/^([A-Z]\w+)\s+(.*)/)
    if (!match) {
      continue
    }

    const key = match[1]
    const val = match[2]

    switch (key) {
    case 'StartCharMetrics':
      const metrics = lines.splice(i + 1, parseInt(val))

      metrics.forEach(function(metric) {
        const name = metric.match(/\bN\s+(\.?\w+)\s*;/)[1]
        glyphWidths[name] = parseInt(metric.match(/\bWX\s+(\d+)\s*;/)[1], 10)
      })
      // C 32 ; WX 278 ; N space ; B 0 0 0 0 ;

      break

    case 'StartKernPairs':
      lines.splice(i + 1, parseInt(val))
      // ignore kern pairs
      break

    // number
    case 'CapHeight':
    case 'XHeight':
    case 'Ascender':
    case 'Descender':
    case 'UnderlineThickness':
    case 'ItalicAngle':
      properties[key] = parseFloat(val, 10)
      break

    // number array
    case 'FontBBox':
      properties[key] = val.split(/\s+/g).map(function(v) {
        return parseFloat(v, 10)
      })
      break

    // string
    case 'FontName':
    case 'FullName':
    case 'FamilyName':
    case 'CharacterSet':
      properties[key] = val
      break

    // ignore other properties
    default:
      break
    }
  }

  const widths = new Array(256)
  for (let i = 0; i < 256; ++i) {
    widths[i] = glyphWidths[WIN_ANSI_CHARACTERS[i]]
  }

  properties.widths = widths

  fs.writeFile(
    path.join(__dirname, '../', 'helvetica.json'),
    JSON.stringify(properties),
    { encoding: 'utf8' },
    function(err) {
      if (err) {
        throw err
      }
    }
  )
  // console.log(widths)
  // console.log(properties)
})
