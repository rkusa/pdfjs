module.exports = function(doc, fixtures) {
  var table = doc.table({
    padding: 5,
    borderWidth: 20,
    borderColor: 0xdddddd,
    backgroundColor: 0xeeeeee,
    widths: ['20%', '20%', '20%', '20%', '20%']
  })

  for (var i = 0; i < 3; ++i) {
    var tr = table.tr()
    tr.td("A")
    tr.td("B")
    tr.td("C")
    tr.td("D")
    tr.td("E")
  }

  var tr = table.tr()
  tr.td("A")
  tr.td("B, C, D", { colspan: 3 })
  tr.td("E")

  for (var i = 0; i < 3; ++i) {
    var tr = table.tr()
    tr.td("A")
    tr.td("B")
    tr.td("C")
    tr.td("D")
    tr.td("E")
  }
}