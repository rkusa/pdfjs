module.exports = function(doc, fixtures) {
  var text = doc.text()
  text.line(fixtures.lorem.long + '\n\n')

  text.add('......................................................................................................................................................................................................')
  text.pageCount() //{ font: fixtures.font.opensans.bold })
  text.br().br()

  for (var i = 0; i < 26; ++i) {
    text.line(fixtures.lorem.long + '\n\n')
  }
}