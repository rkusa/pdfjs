module.exports = function(doc, fixtures) {
  var table = doc.table({
    padding: 15, borderWidth: 20, borderColor: 0xdddddd,
    backgroundColor: 0xeeeeee, widths: ['33%', '33%', '33%'],
    headerRows: 1
  })

  var th = table.tr({ font: fixtures.font.opensans.bold })
  th.td('A')
  th.td('B')
  th.td('C')

  for (var i = 0; i < 3; ++i) {
    var tr = table.tr()
    tr.td(fixtures.lorem.short)
    tr.td(fixtures.lorem.short)
    tr.td(fixtures.lorem.short)
  }
}
