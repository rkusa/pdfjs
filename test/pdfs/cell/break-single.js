module.exports = function(doc, {lorem}) {
  var cell = doc.startCell({
    backgroundColor: 0xeeeeee,
    width: 200,
    padding: 10
  })

  cell.text(lorem.long, { textAlign: 'justify', fontSize: 15 })
  cell.end()
}
