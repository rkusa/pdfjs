const pdf    = require('../../../lib')

module.exports = function(doc, { lorem, font }) {
  // const text = doc.text()
  // text.add('goto')
  // text.add('B', { goTo: 'B' })
  // text.add('or')
  // text.add('A', { goTo: 'A' })

  doc.text('goto B', { goTo: 'B' })
  doc.text('goto A', { goTo: 'A' })

  doc.pageBreak()
  doc.text('A', { destination: 'A' })

  doc.pageBreak()
  doc.text('B', { destination: 'B' })
}
