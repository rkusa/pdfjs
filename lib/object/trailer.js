'use strict'

const version       = require('../../package.json').version
const PDFDictionary = require('./dictionary')
const PDFArray      = require('./array')
const PDFString     = require('./string')

const InfoKeys = {
  title: 'Title',
  author: 'Author',
  subject: 'Subject',
  keywords: 'Keywords',
  creator: 'Creator',
  producer: 'Producer',
  creationDate: 'CreationDate',
  modDate: 'ModDate'
}

class PDFTrailer extends PDFDictionary {
  constructor(size, root, info) {
    super()

    this.set('Size', size)
    this.set('Root', root && root.toReference())

    const id = (new PDFString(info.id)).toHexString()
    this.set('ID', new PDFArray([id, id]))
    
    // Default to now and convert to string
    info.creationDate = formatDate(info.creationDate || new Date)
    if (!info.producer) {
      // Set default producer if not one provided
      info.producer = `pdfjs v${version} (github.com/rkusa/pdfjs)`
    }
    if ('modDate' in info) {
    	// Convert to string
      info.modDate = formatDate(info.modDate)
    }

    const infoDictionary = {}

    for (const key in InfoKeys) {
      if (key in info) {
        infoDictionary[InfoKeys[key]] = new PDFString(info[key])
      }
    }

    this.set('Info', new PDFDictionary(infoDictionary))
  }

  toString() {
    return 'trailer\n' + PDFDictionary.prototype.toString.call(this)
  }

  static parse(xref, lexer) {
    lexer.skipWhitespace(null, true)

    if (lexer.readString(7) !== 'trailer') {
      throw new Error('Invalid trailer: trailer expected but not found')
    }

    lexer.skipWhitespace(null, true)

    const dict = PDFDictionary.parse(xref, lexer)
    return dict
  }
}

module.exports = PDFTrailer

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
