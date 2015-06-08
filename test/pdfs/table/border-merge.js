module.exports = function(doc, fixtures) {
  var table1 = doc.table({
    padding: 5,
    borderWidth: 20,
    borderColor: 0xdddddd,
    backgroundColor: 0xeeeeee,
    widths: ['50%', '50%']
  })

  var tr1 = table1.tr({})
  tr1.td(fixtures.lorem.short, { borderRightWidth: 50 })
  tr1.td(fixtures.lorem.short)

  var tr2 = table1.tr({})
  tr2.td(fixtures.lorem.short, { borderTopWidth: 60 })
  tr2.td(fixtures.lorem.short)

  var table2 = doc.table({
    padding: 5,
    borderColor: 0xdddddd,
    backgroundColor: 0xeeeeee,
    widths: ['50%', '50%']
  })

  tr1 = table2.tr({ borderBottomWidth: 10 })
  tr1.td(fixtures.lorem.short)
  tr1.td(fixtures.lorem.short)

  tr2 = table2.tr({ borderBottomWidth: 5 })
  tr2.td(fixtures.lorem.short)
  tr2.td(fixtures.lorem.short)

  var table3 = doc.table({
    padding: 5,
    borderColor: 0xdddddd,
    backgroundColor: 0xeeeeee,
    widths: ['50%', '50%']
  })

  tr1 = table3.tr({ borderBottomWidth: 5 })
  tr1.td(fixtures.lorem.short)
  tr1.td(fixtures.lorem.short)

  tr2 = table3.tr({ borderTopWidth: 10 })
  tr2.td(fixtures.lorem.short, { colspan: 2 })

  var table4 = doc.table({
    padding: 5,
    borderColor: 0xdddddd,
    backgroundColor: 0xeeeeee,
    widths: ['50%', '50%']
  })

  tr1 = table4.tr({ borderBottomWidth: 5 })
  tr1.td(fixtures.lorem.short)
  tr1.td(fixtures.lorem.short)

  tr2 = table4.tr()
  tr2.td(fixtures.lorem.short, { colspan: 2 })
}
