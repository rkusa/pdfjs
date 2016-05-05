'use strict'

const PDFDictionary = require('./dictionary')
const PDFArray      = require('./array')
const PDFString     = require('./string')

module.exports = class PDFTrailer extends PDFDictionary {
  constructor(size, root, info) {
    super()

    this.set('Size', size)
    this.set('Root', root && root.toReference())

    const id = (new PDFString(info.id)).toHexString()
    this.set('ID', new PDFArray([id, id]))

    this.set('Info', new PDFDictionary({
      Producer: new PDFString(info.producer),
      CreationDate: new PDFString(formatDate(info.creationDate || new Date)),
    }))
  }

  toString() {
    return 'trailer\n' + PDFDictionary.prototype.toString.call(this)
  }
}

function formatDate(date) {
  let str = 'D:'
          + date.getFullYear()
          + ('00' + (date.getMonth() + 1)).slice(-2)
          + ('00' + date.getDate()).slice(-2)
          + ('00' + date.getHours()).slice(-2)
          + ('00' + date.getMinutes()).slice(-2)
          + ('00' + date.getSeconds()).slice(-2)

  let offset = date.getTimezoneOffset()
  const rel = offset === 0 ? 'Z' : (offset > 0 ? '-' : '+')
  offset = Math.abs(offset)
  const hoursOffset = Math.floor(offset / 60)
  const minutesOffset = offset - hoursOffset * 60

  str += rel
      + ('00' + hoursOffset).slice(-2)   + '\''
      + ('00' + minutesOffset).slice(-2) + '\''

  return str
}
