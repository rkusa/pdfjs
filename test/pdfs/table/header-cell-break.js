module.exports = function(doc, fixtures) {
  var table = doc.table({
    padding: 5,
    borderWidth: 20,
    borderColor: 0xdddddd,
    backgroundColor: 0xeeeeee,
    widths: ['50%', '50%'],
    headerRows: 1
  })

  var th = table.tr()
  th.td('A')
  th.td('B')

  var tr = table.tr()
  tr.td(fixtures.lorem.long + fixtures.lorem.long)
  tr.td(fixtures.lorem.long + fixtures.lorem.long)
}
