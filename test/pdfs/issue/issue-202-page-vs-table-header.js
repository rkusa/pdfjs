module.exports = function(doc) {
  doc.header().text("Page Header")

  const table = doc.table({widths: [null]})
  table.header().cell("Table header")
  table.row().cell("Content")
}
