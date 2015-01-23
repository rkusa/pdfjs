module.exports = function(doc, fixtures) {
  var header = doc.header()
  header.text(fixtures.lorem.short, { font: fixtures.font.opensans.bold })

  for (var i = 0; i < 6; ++i) {
    doc.text(fixtures.lorem.long)
  }
}
