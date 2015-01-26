module.exports = function(doc, fixtures) {
  var table = doc.table({
    padding: 5,
    borderWidth: 20,
    borderColor: 0xdddddd,
    backgroundColor: 0xeeeeee,
    widths: ['30%', '30%'],
    headerRows: 1
  })

  var th = table.tr({ font: fixtures.font.opensans.bold })
  th.td('A')
  th.td('B')

  var tr1 = table.tr({})
  tr1.td(fixtures.lorem.long)
  tr1.td(fixtures.lorem.long)

  var tr2 = table.tr({})
  tr2.td(fixtures.lorem.long)
  tr2.td(fixtures.lorem.long)
}
