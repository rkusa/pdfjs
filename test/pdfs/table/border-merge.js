module.exports = function(doc, fixtures) {
  var table = doc.createTable({
    padding: 5,
    borderWidth: 20,
    borderColor: 0xdddddd,
    backgroundColor: 0xeeeeee,
    widths: ['50%', '30%']
  })

  var tr1 = table.tr({})
  tr1.td(fixtures.lorem.short, { borderRightWidth: 50 })
  tr1.td(fixtures.lorem.short)

  var tr2 = table.tr({})
  tr2.td(fixtures.lorem.short, { borderTopWidth: 60 })
  tr2.td(fixtures.lorem.short)
}