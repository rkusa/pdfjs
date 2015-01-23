var pdfjs = require('../../../../')
var fs = require('fs')

module.exports = function(doc, fixtures) {
  doc.style = doc.style.merge({ paddingTop: 100 })

  var img = pdfjs.createImage(fs.readFileSync(__dirname + '/fixtures/word.pdf'))

  doc.image(img, {
    wrap: false, x: 0, y: 0, width: 595.32, height: 841.92
  })

  var text = doc.text({ textAlign: 'justify' })
  text.add(fixtures.lorem.short)
}