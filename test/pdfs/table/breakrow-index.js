module.exports = function(doc, fixtures) {
  var table = doc.table({
    padding: 5,
    borderWidth: 1,
    borderColor: 0xdddddd,
    backgroundColor: 0xeeeeee,
    widths: ['50%', '50%'],
    fontSize: 20
  })

  var before = table.beforeBreak(function(tr, i) {
    tr.td('BEFORE ' + i)
    tr.td('BEFORE ' + i)
  })

  for (var i = 0; i < 50; ++i) {
    var tr = table.tr()
    tr.td(i)
    tr.td(i)
  }
}
