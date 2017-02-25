module.exports = function(doc, { lorem })  {
  doc.text(lorem.shorter)

  const table = doc.table({ widths: [200, 200] })

  for (let r = 0; r < 4; ++r) {
    const row = table.row()

    for (let c = 0; c < 2; ++c) {
      const cell = row.startCell({ padding: 10, backgroundColor: 0xbbbbbb })
      for (let i = 0; i < 2; ++i) {
        cell.text(lorem.shorter, { fontSize: 20 })
      }
      cell.end()
    }

    row.end()
  }

  table.end()

  doc.text(lorem.shorter)
}

