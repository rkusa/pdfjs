module.exports = function(doc, fixtures) {
  var table = doc.table({
    padding: 5,
    borderWidth: 20,
    borderColor: 0xdddddd,
    backgroundColor: 0xeeeeee,
    widths: ['30%', '70%']
  })


  var outerTr = table.tr()
  outerTr.td(fixtures.lorem.long)
  var td = outerTr.td()

  var inner = td.table({ widths: ['50%', '50%'] })
  var innerTr = inner.tr()
  innerTr.td(fixtures.lorem.long)
  innerTr.td(fixtures.lorem.long)
}