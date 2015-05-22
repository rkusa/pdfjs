module.exports = function(doc, fixtures) {

  // absolute
  var ops = doc.ops()
  ops.op(0, 0, 0, 'rg')
  ops.op(0, 830, 297.6648, 11.896, 're')
  ops.op('f')


  doc.text(fixtures.lorem.short)

  // relative
  ops = doc.ops()
  ops.op(function(x, y) {
    var height = 40
    return [x, y - height, x + 60, height, 're']
  })
  ops.op('f')

  // inside table
  var table = doc.table({ padding: 10, widths: ['20%', '10%'] })

  for (var i = 0; i < 2; ++i) {
    var tr = table.tr()
    tr.td('Test')

    var height = 40
    var td = tr.td({ height: height })
    ops = td.ops()
    ops.op(1, 0, 0, 'rg')
    ops.op(function(x, y) {
      return [x, y - height, x + 60, height, 're']
    })
    ops.op('f')
  }
}


