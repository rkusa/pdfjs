module.exports = function(doc, {lorem}) {
  doc.text(lorem.shorter)

  const table = doc.table({ widths: [null, null, null] })
  const row = table.row()

  const cell1 = row.startCell({ padding: 0, backgroundColor: 0xeeeeee })
  cell1.text(lorem.short)
  cell1.end()

  const cell2 = row.startCell({ padding: 0, backgroundColor: 0xbbbbbb })
  for (let i = 0; i < 3; ++i) {
    cell2.text(lorem.short)
  }
  cell2.end()

  const cell3 = row.startCell({ padding: 20, backgroundColor: 0xdddddd })
  cell3.text(lorem.shorter)
  cell3.end()

  row.end()

  table.end()

  doc.text(lorem.shorter)
}

