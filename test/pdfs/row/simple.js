module.exports = function(doc, fixtures) {
  doc.text(fixtures.lorem.shorter)
  let row, cell
  row = doc.startRow()
    cell = row.startCell({ padding: 0, backgroundColor: 0xeeeeee, width: 150 })
      cell.text(fixtures.lorem.short)
    cell.end()
    cell = row.startCell({ padding: 0, backgroundColor: 0xbbbbbb, width: 150 })
      for (let i = 0; i < 3; ++i) {
        cell.text(fixtures.lorem.short)
      }
    cell.end()
    cell = row.startCell({ padding: 20, backgroundColor: 0xdddddd, width: 150 })
      cell.text(fixtures.lorem.shorter)
    cell.end()
  row.end()
  doc.text(fixtures.lorem.shorter)
}

