module.exports = function(doc, fixtures) {
  var text = doc.text({ textAlign: 'justify' })
  text.add(fixtures.lorem.short)

  doc.image(fixtures.image.complexPdf)

  var text = doc.text({ textAlign: 'justify' })
  text.add(fixtures.lorem.short)
}