module.exports = function(doc, fixtures) {
  var box = doc.box({
    borderWidth: 20,
    borderColor: 0xdddddd,
    backgroundColor: 0xeeeeee,
    width: '50%',
    padding: 10
  })

  var content = box.text({ textAlign: 'justify' })
  content.add(fixtures.lorem.short)
}
