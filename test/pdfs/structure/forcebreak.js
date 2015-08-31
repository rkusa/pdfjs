module.exports = function(doc, fixtures) {
  doc.footer().text()
     .pageNumber().append('/').appendPageCount()

  doc.text(fixtures.lorem.short)
  doc.pageBreak()
  doc.text(fixtures.lorem.short)
}
