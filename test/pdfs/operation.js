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
}


