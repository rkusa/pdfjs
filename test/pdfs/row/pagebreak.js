module.exports = function(doc, { lorem })  {
  doc.text(lorem.shorter, { fontSize: 20 })
  let row, cell
  row = doc.startRow()
    cell = row.startCell({ padding: 0, backgroundColor: 0xeeeeee, width: 150 })
      cell.text(lorem.short, { fontSize: 20 })
    cell.end()
    cell = row.startCell({ padding: 20, backgroundColor: 0xbbbbbb, width: 150 })
      for (let i = 0; i < 2; ++i) {
        cell.text(lorem.short, { fontSize: 20 })
      }
    cell.end()
    cell = row.startCell({ padding: 10, backgroundColor: 0xdddddd, width: 150 })
      cell.text(lorem.shorter, { fontSize: 20 })
    cell.end()
  row.end()
  doc.text(lorem.shorter, { fontSize: 20 })
}

