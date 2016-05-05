'use strict'

const Readable = require('stream').Readable
const PDFString = require('./object/string')
const PDFXref = require('./object/xref')
const PDFObject = require('./object/object')
const PDFStream = require('./object/stream')
const PDFTrailer = require('./object/trailer')
const Pages = require('./object/pages')
const Page = require('./object/page')
const Ops = require('./ops')

const version = require('../package.json').version

module.exports = class Document extends Readable {
  constructor(opts) {
    if (!opts) {
      opts = {}
    }

    // readable stream options
    super({
      highWaterMark: opts.highWaterMark || 16384, // 16kB
    })

    this.op = new Ops(this)

    this.version = '1.3'

    this.info = {
      // TODO: uuid
      id: "42",
      producer: `pdfjs v${version} (github.com/rkusa/pdfjs)`,
      creationDate: null
    }

    this.nextObjectId = 1

    this.defaultFont = opts.font
    this.registerObject(this.defaultFont.object)

    this.precision = 3

    writeHeader(this)

    this.xref = new PDFXref()

    this.width = 595.296
    this.height = 841.896

    this.pages = new Pages(this.width, this.height)
    this.registerObject(this.pages)
    this.currentPage = new Page(this.pages)
    this.pages.add(this.currentPage)
    this.currentPage.fonts.add(this.defaultFont.alias, this.defaultFont.object.toReference())
  }

  text(text) {
    const font = this.defaultFont

    this.op.BT()

    // set current font
    this.op.Tf(font.alias, 11)
    this.op.rg(0, 0, 0)

    // encode according to font mapping
    text = font.encode(text)

    this.op.Tm(1, 0, 0, 1, 10, 600)
    this.op.Tj(text)
    // doc.Td(width, 0)

    this.op.ET()
  }

  registerObject(object) {
    if (object instanceof PDFStream) {
      object = object.object
    }

    object.id = this.nextObjectId
    this.nextObjectId++
  }

  writeObject(object) {
    if (object instanceof PDFStream) {
      object = object.object
    }

    if (!object.id) {
      this.registerObject(object)
    }

    this.xref.add(object.id, this._readableState.length, object)
    this.push(object.toString() + '\n\n')
  }

  end() {
    for (const page of this.pages.pages) {
      this.writeObject(page.contents.object)
      this.writeObject(page)
    }
    this.writeObject(this.pages)

    this.defaultFont.write(this)

    const catalog = new PDFObject('Catalog')
    catalog.prop('Pages', this.pages.toReference())
    this.writeObject(catalog)

    // to support random access to individual objects, a PDF file
    // contains a cross-reference table that can be used to locate
    // and directly access pages and other important objects within the file
    const startxref = this._readableState.length
    this.push(this.xref.toString())

    // trailer
    const objectsCount = this.nextObjectId - 1
    const trailer = new PDFTrailer(objectsCount + 1, catalog, this.info)
    this.push(trailer.toString() + '\n')

    // startxref
    this.push('startxref\n')
    this.push(startxref + '\n')
    this.push('%%EOF')

    // close readable stream
    this.push(null)
  }

  write() {
    const line = Array.prototype.map.call(arguments, arg => {
      return typeof arg === 'number' ? toFixed(arg, this.precision) : arg
    })
    this.currentPage.contents.writeLine(line.join(' '))
  }
}

function writeHeader(doc) {
  // header
  doc.push(`%PDF-${doc.version}\n`)

  // The PDF format mandates that we add at least 4 commented binary characters
  // (ASCII value >= 128), so that generic tools have a chance to detect
  // that it's a binary file
  doc.push('%\xFF\xFF\xFF\xFF\n\n', 'binary')
}

function writeXref(doc) {

}

function writeTrailer(doc) {

}

