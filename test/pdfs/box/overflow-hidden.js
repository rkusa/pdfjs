module.exports = function(doc, fixtures) {
  var box = doc.box({
    borderWidth: 1,
    borderColor: 0xdddddd,
    padding: 10,
    width: 200,
    height: 200,
    overflow: 'hidden'
  })

  var content = box.text({ textAlign: 'justify' })
  content.add(fixtures.lorem.short)

  doc.text(fixtures.lorem.short)
}
