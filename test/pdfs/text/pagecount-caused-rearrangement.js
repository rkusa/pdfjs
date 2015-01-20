module.exports = function(doc, fixtures) {
  var text = doc.createText()
  text.addLine(fixtures.lorem.long + '\n\n')

  text.add('......................................................................................................................................................................................................')
  text.addPageCount() //{ font: fixtures.font.opensans.bold })
  text.addLineBreak().addLineBreak()

  for (var i = 0; i < 26; ++i) {
    text.addLine(fixtures.lorem.long + '\n\n')
  }
}