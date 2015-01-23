var pdfjs = require('../../../../')
var path = require('path')
var fs = require('fs')

module.exports = function(doc, fixtures) {
  doc.style = doc.style.merge({ paddingTop: 100 })

  var img = pdfjs.createImage(fs.readFileSync(path.join(__dirname, 'fixtures/word.pdf')))

  doc.image(img, {
    wrap: false, x: 0, y: 50, width: 612, height: 792
  })

  var text = doc.text({ textAlign: 'justify' })
  text.add(fixtures.lorem.short)
}
