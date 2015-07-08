module.exports = function(doc, fixtures) {
  var table = doc.table({
    borderWidth: 1,
    borderColor: 0xdddddd,
    padding: 10,
    widths: [200]
  })

  for (var i = 0; i < 5; ++i) {
    var tr = table.tr({ height: 220, overflow: 'hidden' })
    tr.td(fixtures.lorem.short)
  }

  doc.text(fixtures.lorem.short)
}
