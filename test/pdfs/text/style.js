module.exports = function(doc, fixtures) {
  // align left
  var text = doc.text({ textAlign: 'left' })
  text.add(fixtures.lorem.short)

  // align center
  var text = doc.text({ textAlign: 'center' })
  text.add(fixtures.lorem.short)

  // align right
  var text = doc.text({ textAlign: 'right' })
  text.add(fixtures.lorem.short)

  // align justify
  var text = doc.text({ textAlign: 'justify' })
  text.add(fixtures.lorem.short)

  // switch font style
  var text = doc.text({ font: fixtures.font.opensans.regular })
  text.add('Regular')
      .add('Bold', { font: fixtures.font.opensans.bold })
      .add('Regular', { font: fixtures.font.opensans.regular })
      .add('Big', { fontSize: 20 })
      .add('BigBold', { fontSize: 20, font: fixtures.font.opensans.bold })
      .add('Regular')
}