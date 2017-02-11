module.exports = function(doc, {lorem}) {
  for (let i = 0; i < 3; ++i) {
    doc.text(lorem.short, { fontSize: 20 })
  }

  doc.text('---------------------')

  // should be moved to the next page retrospectively
  let row, cell
  row = doc.startRow()
    row.cell(lorem.short, { backgroundColor: 0xeeeeee, padding: 10, fontSize: 20, width: 200 })
    row.cell(lorem.short, { backgroundColor: 0xbbbbbb, padding: 10, fontSize: 20, width: 200 })
  row.end()

  doc.text(lorem.short, { fontSize: 20 })
  doc.text(lorem.short, { fontSize: 20 })
}