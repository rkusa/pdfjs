module.exports = function(doc, fixtures) {
  var table = doc.table({
    padding: 5,
    borderWidth: 1,
    borderColor: 0xdddddd,
    backgroundColor: 0xeeeeee,
    widths: ['50%', '50%']
  })

  var beforeBreak = table.beforeBreak()
  beforeBreak.td('A')
  beforeBreak.td('B')

  var tr1 = table.tr({})
  tr1.td(fixtures.lorem.short + fixtures.lorem.short + fixtures.lorem.short + fixtures.lorem.short)
  tr1.td(fixtures.lorem.short)

  for (var i = 0; i < 10; ++i) {
    var tr = table.tr()
    tr.td(i)
    tr.td(i)
  }
}
