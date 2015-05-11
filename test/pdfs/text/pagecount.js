module.exports = function(doc, fixtures) {
  var text = doc.text()

  for (var j = 0; j < 3; ++j) {
    if (j > 0) {
      for (var i = 0; i < 70; ++i) {
        text.br()
      }
    }


    text.pageNumber().add('/').pageCount().br()
        .pageNumber().append('/').appendPageCount()
  }
}
