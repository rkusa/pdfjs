module.exports = function(doc, fixtures) {
  var text = doc.createText({ textAlign: 'right' })
  text.add(fixtures.lorem.long)
}