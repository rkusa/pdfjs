module.exports = function(doc, fixtures) {
  var footer = doc.footer()
  footer.text(fixtures.lorem.short, { font: fixtures.font.opensans.bold })

  for (var i = 0; i < 7; ++i) {
    doc.text(fixtures.lorem.long)
  }
}
