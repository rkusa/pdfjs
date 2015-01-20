module.exports = function(doc, fixtures) {
  doc.style = doc.style.merge({ paddingLeft: 100 })

  doc.image(fixtures.image.pdf, {
    width: 64, align: 'center', wrap: false, x: 10
  })

  var text = doc.text({ textAlign: 'justify' })
  text.add(fixtures.lorem.short)

  doc.image(fixtures.image.pdf)

  doc.image(fixtures.image.pdf, {
    width: 128, align: 'left'
  })

  doc.image(fixtures.image.pdf, {
    height: 55, align: 'center'
  })

  doc.image(fixtures.image.pdf, {
    width: 128, align: 'right'
  })

  var text = doc.text({ textAlign: 'justify' })
  text.add(fixtures.lorem.short)
}