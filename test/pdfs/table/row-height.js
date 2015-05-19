module.exports = function(doc, fixtures) {
  var table = doc.table({
    backgroundColor: 0xeeeeee, widths: ['50%', '50%']
  })

  for (var i = 0; i < 2; ++i) {
    var tr = table.tr({ height: 200 + i * 50 })
    tr.td(fixtures.lorem.short)
    tr.td(fixtures.lorem.short)
  }

  doc.text(fixtures.lorem.short)
}
