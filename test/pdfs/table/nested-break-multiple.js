module.exports = function(doc, fixtures) {
  var table = doc.createTable({
    padding: 5,
    borderWidth: 20,
    borderColor: 0xdddddd,
    backgroundColor: 0xeeeeee,
    widths: ['30%', '70%']
  })


  var outerTr = table.tr()
  outerTr.td(fixtures.lorem.long + fixtures.lorem.long)
  var td = outerTr.td()

  var inner = td.createTable({ widths: ['50%', '50%'] })
  var innerTr = inner.tr()
  innerTr.td(fixtures.lorem.long + fixtures.lorem.long)
  innerTr.td(fixtures.lorem.long + fixtures.lorem.long)
}