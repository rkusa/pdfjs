module.exports = function(doc, fixtures) {
  var box = doc.box({
    borderWidth: 20,
    borderColor: 0xdddddd,
    backgroundColor: 0xeeeeee,
    padding: 10,
    y: 500,
    x: 60,
    minHeight: 300
  })

  var content = box.text({ textAlign: 'justify' })
  content.add(fixtures.lorem.short)

  doc.text(fixtures.lorem.short)
}
