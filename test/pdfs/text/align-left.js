module.exports = function(doc, fixtures) {
  var text = doc.createText({ textAlign: 'left' })
  text.add(fixtures.lorem.long)
}