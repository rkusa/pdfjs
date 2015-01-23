module.exports = function(doc, fixtures) {
  var text = doc.text()
  text.pageNumber().add('/').pageCount()

  for (var j = 0; j < 2; ++j) {
    for (var i = 0; i < 70; ++i) {
      text.br()
    }

    text.pageNumber().add('/').pageCount()
  }
}
