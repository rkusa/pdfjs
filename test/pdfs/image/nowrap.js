module.exports = function(doc, fixtures) {
  var header = doc.header()
  header.image(fixtures.image.pdf, {
    wrap: false, y: 10, x: 10
  })

  for (var i = 0; i < 6; ++i) {
    doc.text(fixtures.lorem.long)
  }
}
