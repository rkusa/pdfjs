module.exports = function(doc, fixtures) {
  var text = doc.text()
  text.add('https://github.com/rkusa/pdfjs << link')
}
