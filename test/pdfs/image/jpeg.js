module.exports = function(doc, fixtures) {
  doc.style = doc.style.merge({ paddingLeft: 100 })

  doc.addImage(fixtures.image.jpeg, {
    width: 64, align: 'center', wrap: false, x: 10
  })

  var text = doc.createText({ textAlign: 'justify' })
  text.add(fixtures.lorem.short)

  doc.addImage(fixtures.image.jpeg, {
    width: 128, align: 'left'
  })

  doc.addImage(fixtures.image.jpeg, {
    height: 55, align: 'center'
  })

  doc.addImage(fixtures.image.jpeg, {
    align: 'right'
  })

  var text = doc.createText({ textAlign: 'justify' })
  text.add(fixtures.lorem.short)
}