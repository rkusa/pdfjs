module.exports = function(doc, fixtures) {
  var table = doc.table({
    padding: 5,
    borderWidth: 1,
    borderColor: 0xdddddd,
    backgroundColor: 0xeeeeee,
    widths: ['50%', '50%']
  })

  var tr1 = table.tr({ backgroundColor: 0xff0000 })
  tr1.td(fixtures.lorem.short)
  tr1.td(fixtures.lorem.short, { backgroundColor: 0x00ff00 })

  var tr2 = table.tr({})
  tr2.td(fixtures.lorem.short)
  tr2.td(fixtures.lorem.short, { backgroundColor: 0x00ff00 })
}
