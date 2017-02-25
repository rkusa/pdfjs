module.exports = function(doc, {lorem}) {
  const cell = doc.startCell({
    backgroundColor: 0xeeeeee,
    width: 250,
    padding: 10
  })

  cell.text(lorem.shorter, { fontSize: 20 })

  const inner = cell.startCell({
    backgroundColor: 0xdddddd,
    padding: 10
  })

  inner.text(lorem.long, { fontSize: 20 })

  inner.end()

  cell.text(lorem.shorter, { fontSize: 20 })
  cell.end()
}
