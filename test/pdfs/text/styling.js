module.exports = function(doc, fixtures) {
  const text = doc.startText()
  text.add('Regular')
      .add('Bold', { font: fixtures.font.afm.bold })
      .add('Regular', { font: fixtures.font.afm.regular })
      .add('Big', { fontSize: 20 })
      .add('BigBold', { fontSize: 20, font: fixtures.font.afm.bold })
      .add('Red', { color: 0xff0000 })
      .add('Regular')
      .end()
}
