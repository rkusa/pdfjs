module.exports = function(doc, fixtures) {
  doc.footer().text()
     .pageNumber().add('/').pageCount().br()
     .pageNumber().append('/').appendPageCount()

  var text = doc.text()

  for (var j = 0; j < 3; ++j) {
    for (var i = 0; i < 70; ++i) {
      text.add('-').br()
    }
  }
}
