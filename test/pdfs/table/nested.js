module.exports = function(doc, fixtures) {
  var table = doc.table({
    padding: 5,
    borderWidth: 20,
    borderColor: 0xdddddd,
    backgroundColor: 0xeeeeee,
    borderWidth: 1,
    widths: ['30%', '70%']
  })

  var outerTr = table.tr()
  outerTr.td(fixtures.lorem.short)
  var td = outerTr.td()

  var inner = td.table({
    borderWidth: 0,
    borderHorizontalWidth: 1,
    borderColor: 0xff0000,
    backgroundColor: 0xffffff,
    widths: ['50%', '50%']
  })
  var innerTr = inner.tr()
  innerTr.td(fixtures.lorem.short)
  innerTr.td(fixtures.lorem.short)
}
