const pdf    = require('../../../lib')

module.exports = async function(doc, { lorem, font }) {
  doc.text(lorem.short)
  return await doc.asBuffer()
}
