module.exports = function(doc, {document}) {
  const external = document.test

  doc.addPageRangeOf(external, 1, 2)

  doc.text('Should be on third page ...')
}
