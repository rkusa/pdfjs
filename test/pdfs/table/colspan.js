module.exports = function(doc, fixtures) {
  var table = doc.table({
    padding: 5,
    borderWidth: 20,
    borderColor: 0xdddddd,
    backgroundColor: 0xeeeeee,
    widths: ['20%', '20%', '20%', '20%', '20%']
  })

  var tr
  for (var i = 0;  i < 3; ++i) {
    tr = table.tr()
    tr.td('A')
    tr.td('B')
    tr.td('C')
    tr.td('D')
    tr.td('E')
  }

  tr = table.tr()
  tr.td('A')
  tr.td('B, C, D', { colspan: 3 })
  tr.td('E')

  for (i = 0; i < 3; ++i) {
    tr = table.tr()
    tr.td('A')
    tr.td('B')
    tr.td('C')
    tr.td('D')
    tr.td('E')
  }
}
