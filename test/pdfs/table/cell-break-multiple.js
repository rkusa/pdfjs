module.exports = function(doc, fixtures) {
  var table = doc.table({
    padding: 5,
    borderWidth: 20,
    borderColor: 0xdddddd,
    backgroundColor: 0xeeeeee,
    widths: ['30%', '30%']
  })

  var tr1 = table.tr({})
  tr1.td(fixtures.lorem.long)
  tr1.td(fixtures.lorem.long + fixtures.lorem.long)

  var tr2 = table.tr({})
  tr2.td(fixtures.lorem.long + fixtures.lorem.long)
  tr2.td(fixtures.lorem.long + fixtures.lorem.long)
}
