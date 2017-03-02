module.exports = function(doc) {
  const footer = doc.footer()
  footer.text('before', { textAlign: 'center' })
  footer.pageNumber((curr, total) => `${curr} / ${total}`, { textAlign: 'center', fontSize: 16 })
  footer.text('after', { textAlign: 'center' })

  const header = doc.header()
  header.text('before', { textAlign: 'center' })
  header.pageNumber((curr, total) => `${curr} / ${total}`, { textAlign: 'center', fontSize: 16 })
  header.text('after', { textAlign: 'center' })

  doc.text('Hello World 1')

  doc.pageBreak()

  doc.text('Hello World 2')
}
