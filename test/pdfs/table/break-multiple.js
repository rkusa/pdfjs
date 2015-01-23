module.exports = function(doc, fixtures) {
  var table = doc.table({
    padding: 5,
    borderWidth: 20,
    borderColor: 0xdddddd,
    backgroundColor: 0xeeeeee,
    widths: ['50%', '30%']
  })

  for (var i = 0; i < 7; ++i) {
    var tr = table.tr({})
    tr.td(fixtures.lorem.short)
    tr.td(fixtures.lorem.short)
  }
}
