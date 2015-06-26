module.exports = function(doc, fixtures) {
  doc.footer().text()
     .pageNumber().add('/').pageCount().br()
     .pageNumber().append('/').appendPageCount()

  var text = doc.text()

  for (var j = 0; j < 4; ++j) {
    if (j > 0) {
      for (var i = 0; i < 66; ++i) {
        text.add('-').br()
      }
    }

    text.add('total').pageCount().append('; current ').pageNumber().br()
  }
}
