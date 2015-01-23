module.exports = function(doc, fixtures) {
  var table = doc.table({
    padding: 15, borderWidth: 20, borderColor: 0xdddddd,
    backgroundColor: 0xeeeeee, widths: ['33%', '33%', '33%'],
    headerRows: 2
  })

  var th1 = table.tr({ font: fixtures.font.opensans.bold })
  th1.td('A')
  th1.td('B')
  th1.td('C')

  var th2 = table.tr({ font: fixtures.font.opensans.bold })
  th2.td('1')
  th2.td('2')
  th2.td('3')

  for (var i = 0; i < 3; ++i) {
    var tr = table.tr()
    tr.td(fixtures.lorem.short)
    tr.td(fixtures.lorem.short)
    tr.td(fixtures.lorem.short)
  }
}
