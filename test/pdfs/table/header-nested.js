module.exports = function(doc, fixtures) {
  var table = doc.table({
    padding: 5,
    borderWidth: 20,
    borderColor: 0xdddddd,
    backgroundColor: 0xeeeeee,
    widths: ['100%'],
    headerRows: 1
  })

  var outerTh = table.tr()
  outerTh.td('A')

  var outerTr = table.tr()
  var td = outerTr.td()

  var inner = td.table({
    widths: ['50%', '50%'],
    backgroundColor: 0xcccccc,
    headerRows: 1,
    borderWidth: 10,
    borderColor: 0xaaaaaa
  })

  var innerTh = inner.tr()
  innerTh.td('A')
  innerTh.td('B')

  var innerTr = inner.tr()
  innerTr.td(fixtures.lorem.long)
  innerTr.td(fixtures.lorem.long)

  innerTr = inner.tr()
  innerTr.td(fixtures.lorem.short)
  innerTr.td(fixtures.lorem.short)

  innerTr = inner.tr()
  innerTr.td(fixtures.lorem.long + fixtures.lorem.long)
  innerTr.td(fixtures.lorem.long + fixtures.lorem.long)
}
