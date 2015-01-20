module.exports = function(doc, fixtures) {
  var text = doc.createText({ textAlign: 'justify' })
  text.add(fixtures.lorem.long)
}