module.exports = function(doc, fixtures) {
  var footer = doc.footer()
  footer.image(fixtures.image.pdf, {
    width: 64
  })

  for (var i = 0; i < 6; ++i) {
    doc.text(fixtures.lorem.long)
  }
}
