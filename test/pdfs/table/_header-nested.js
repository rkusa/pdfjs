module.exports = function(doc, fixtures) {
  var table = doc.table({
    padding: 5,
    borderWidth: 20,
    borderColor: 0xdddddd,
    backgroundColor: 0xeeeeee,
    widths: ['30%', '70%'],
    headerRows: 1
  })

  var outerTh = table.tr()
  outerTh.td('A')
  outerTh.td('B')

  var outerTr = table.tr()
  outerTr.td(fixtures.lorem.long)
  var td = outerTr.td()

  var inner = td.table({
    widths: ['50%', '50%'],
    headerRows: 1
  })

  var innerTh = inner.tr()
  innerTh.td('A')
  innerTh.td('B')

  var innerTr = inner.tr()
  innerTr.td(fixtures.lorem.long)
  innerTr.td(fixtures.lorem.long)
}
