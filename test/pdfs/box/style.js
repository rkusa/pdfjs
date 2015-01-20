module.exports = function(doc, fixtures) {
  var box = doc.createBox({
    borderWidth: 20,
    borderColor: 0xdddddd,
    backgroundColor: 0xeeeeee,
    width: '50%',
    padding: 10
  })

  var content = box.createText({ textAlign: 'justify' })
  content.add(fixtures.lorem.short)
}