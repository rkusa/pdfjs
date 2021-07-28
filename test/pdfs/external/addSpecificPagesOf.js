module.exports = function(doc, {document}) {
  const external = document.test

  doc.addSpecificPagesOf(external, [1, 2])

  doc.text('Should be on third page ...')
}
