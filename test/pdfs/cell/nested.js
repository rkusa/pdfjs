module.exports = function(doc, fixtures) {
  doc.text(fixtures.lorem.shorter)
  const outer = doc.startCell({ width: 400, padding: 20, backgroundColor: 0xeeeeee })
  const inner = outer.startCell({ padding: 20, backgroundColor: 0xdddddd })
  inner.text(fixtures.lorem.short)
  inner.text(fixtures.lorem.short)
  inner.end()
  outer.text('Hello World')
  outer.end()
  doc.text('Hello World')
}

