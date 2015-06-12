module.exports = function(doc, fixtures) {

  var table = doc.table({
    padding: 5,
    borderWidth: 1,
    borderColor: 0xdddddd,
    backgroundColor: 0xeeeeee,
    widths: ['100%']
  })

  var tr1 = table.tr({})
  tr1.td({ height: 600 })

  var tr2 = table.tr({ allowBreak: true })

  var table2 = tr2.td({ allowBreak: true }).table({
    padding: 5,
    backgroundColor: 0xcccccc,
    borderColor: 0xaaaaaa,
    widths: ['50%', '50%'],
    headerRows: 2
  })

  var beforeBreak = table2.beforeBreak()
  beforeBreak.td('A\nA\nA')
  beforeBreak.td('B\nB\nB')

  for (var i = 0; i < 10; ++i) {
    var tr = table2.tr()
    tr.td(i)
    tr.td(i)
  }
}
