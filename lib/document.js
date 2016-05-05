'use strict'

const Readable = require('stream').Readable
const PDFXref = require('./object/xref')
const PDFObject = require('./object/object')
const PDFStream = require('./object/stream')
const PDFTrailer = require('./object/trailer')
const Pages = require('./object/pages')
const Page = require('./object/page')
const uuid = require('node-uuid')

const version = require('../package.json').version

const READING = Symbol('READING')
const RESOLVE = Promise.resolve()

const ops = require('./ops')

module.exports = class Document extends Readable {
  constructor(opts) {
    if (!opts) {
      opts = {}
    }

    // readable stream options
    super({
      highWaterMark: opts.highWaterMark || 16384, // 16kB
    })

    this.version = '1.3'

    this.info = {
      id: uuid.v4(),
      producer: `pdfjs v${version} (github.com/rkusa/pdfjs)`,
      creationDate: new Date(),
    }

    this.nextObjectId = 1

    this.defaultFont = opts.font
    this.registerObject(this.defaultFont.object)

    this.precision = 3

    this.xref = new PDFXref()

    this.width = 595.296
    this.height = 841.896

    this.pages = new Pages(this.width, this.height)
    this.registerObject(this.pages)

    this[READING] = false
    this.length = 0
  }

  _read(/* size */) {
    this[READING] = true
    this.emit('read')
  }

  write(chunk) {
    if (this[READING]) {
      if (!this.push(chunk, 'binary')) {
        this[READING] = false
      }
      this.length += chunk.length
      return RESOLVE
    } else {
      return new Promise(resolve => {
        this.once('read', () => {
          resolve(this.write(chunk))
        })
      })
    }
  }

  // TODO: non public method
  async startPage() {
    if (this.length === 0) {
      await this.write(createHeader(this))
    }

    const page = this.currentPage = new Page(this.pages)
    this.pages.add(this.currentPage)
    this.currentPage.fonts.add(this.defaultFont.alias, this.defaultFont.object.toReference())

    this.registerObject(page.contents)
    this.registerObject(page.length)

    page.contents.prop('Length', page.length.toReference())

    this.xref.add(page.contents.id, this.length, page.contents)

    const chunk = page.contents.id + ' ' + page.contents.rev + ' obj\n'
      + page.contents.properties.toString() + '\n'
      + 'stream\n'

    this.pageStart = this.length + chunk.length
    await this.write(chunk)
  }

  async endPage() {
    const length = this.length - this.pageStart - 1

    const page = this.currentPage
    page.length.content = length

    const chunk = 'endstream\nendobj\n\n'
    await this.write(chunk)
    await this.writeObject(page.length)
    await this.writeObject(page)
  }

  async text(text) {
    if (!this.currentPage) {
      await this.startPage()
    }

    const font = this.defaultFont

    // encode according to font mapping
    text = font.encode(text)

    const chunk = ops.BT()
      // set current font
      + ops.Tf(font.alias, 11)
      + ops.rg(0, 0, 0)
      // set text position
      + ops.Tm(1, 0, 0, 1, 10, 600)
      // write text
      + ops.Tj(text)
      // shift cursor
      // ops.Td(width, 0)
      + ops.ET()

    await this.write(chunk)
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

    this.xref.add(object.id, this.length, object)
    return this.write(object.toString() + '\n\n')
  }

  async end() {
    await this.endPage()

    // for (const page of this.pages.pages) {
    //   // this.writeObject(page.contents.object)
    //   this.writeObject(page)
    // }
    await this.writeObject(this.pages)

    await this.defaultFont.write(this)

    const catalog = new PDFObject('Catalog')
    catalog.prop('Pages', this.pages.toReference())
    await this.writeObject(catalog)

    // to support random access to individual objects, a PDF file
    // contains a cross-reference table that can be used to locate
    // and directly access pages and other important objects within the file
    const startxref = this.length
    await this.write(this.xref.toString())

    // trailer
    const objectsCount = this.nextObjectId - 1
    const trailer = new PDFTrailer(objectsCount + 1, catalog, this.info)
    await this.write(trailer.toString() + '\n')

    // startxref
    await this.write('startxref\n' + startxref + '\n%%EOF')

    // close readable stream
    this.push(null)
  }
}

function createHeader(doc) {
  // header
  const chunk = `%PDF-${doc.version}\n`
    // The PDF format mandates that we add at least 4 commented binary characters
    // (ASCII value >= 128), so that generic tools have a chance to detect
    // that it's a binary file
    + '%\xFF\xFF\xFF\xFF\n\n'

  return chunk
}

