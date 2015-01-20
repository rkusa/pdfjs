module.exports = function(doc, fixtures) {
  var text = doc.text()
  text.add('- Foobar')
      .br()
      .add('- Foo')
      .append('bar')
      .br()
      .line('- Foobar')
      .add('- Foobar\n')
      .add('- Foobar')

  // expectation:
  // - Foobar
  // - Foobar
  // - Foobar
  // - Foobar
  // - Foobar
}
