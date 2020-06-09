const test = require('tape')
const pdf = require('../../lib')

test('multiple table headers error', function(t) {
  const doc = new pdf.Document()
  const table = doc.table({widths: []})
  table.header()
  t.throws(() => table.header(), /The table already has a header, add additional rows to the existing table header instead/)
  t.end()
})
