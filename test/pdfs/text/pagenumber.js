module.exports = function(doc, fixtures) {
  var text = doc.createText()
  text.addPageNumber()

  for (var j = 0; j < 2; ++j) {
    for (var i = 0; i < 70; ++i) {
      text.addLineBreak()
    }

    text.addPageNumber()
  }
}