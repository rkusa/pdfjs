'use strict'

const Readable = require('stream').Readable
const PDFXref = require('./object/xref')
const PDFObject = require('./object/object')
const PDFStream = require('./object/stream')
const PDFTrailer = require('./object/trailer')
const Pages = require('./object/pages')
const Page = require('./object/page')
const uuid = require('node-uuid')
const LineBreaker = require('linebreak')
const unorm = require('unorm')

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
    if (!text) {
      return RESOLVE
    }

    if (!this.currentPage) {
      await this.startPage()
    }

    const font = this.defaultFont

    // enforce string
    text = String(text)

    let chunk = ops.BT()
      // set current font and color
      + ops.Tf(font.alias, 11)
      + ops.rg(0, 0, 0)

    const x = 10
    let y = 600
    const lineHeight = 1.15
    const breaker = new LineBreaker(text)
    const line = []
    const width = 500
    const fontSize = 11
    const scaleFactor = 1000 / fontSize
    let spaceLeft = width, isLastLine = false
    let last = 0, bk

    while ((bk = breaker.nextBreak())) {
      // get the string between the last break and this one
      let word = text.slice(last, bk.position)

      // count linebreaks
      let linebreaks = 0
      while (!bk.required && word.match(/(\r\n|\n|\r)$/)) {
        word = word.replace(/(\r\n|\n|\r)$/, '')
        linebreaks++
      }

      // separate words, if has whitespace, is at the end of the text or
      // ends with a whitespace
      if (linebreaks > 0 || bk.position === text.length || text[bk.position - 1].match(/\s/)) {
        last = bk.position
      } else {
        continue
      }

      // remove trailing whitespaces if white-space style is set to normal
      // if (style.whiteSpace === 'normal') {
        word = word.replace(/^\s+/, '').replace(/\s+$/, '')
      // }

      // remove newline characters
      if (bk.required) {
        word = word.replace(/(\r\n|\n|\r)/, '')
        linebreaks++
      }

      word = unorm.nfc(word)

      // TODO: render word
      let wordWidth = font.stringWidth(word, fontSize)
      // add whitespace length for every word, except the first on in the line
      if (line.length > 0) {
        wordWidth += font.stringWidth(' ', fontSize)
      }

      if (bk.required || linebreaks > 0 || (spaceLeft - wordWidth) < 0) {
        // render line
        let left = x

        // calc max line height
        // const height = Math.max.apply(Math,
        //   line.map(w => font.lineHeight(fontSize, true))
        // ) * lineHeight
        const height = font.lineHeight(fontSize, true) * lineHeight

        // calculate remaining space
        // TODO use word specific font
        const freeSpace = spaceLeft
        // const freeSpace = width - line.map(w => w.l).reduce((l, r) => l + r, 0)

        let extraSpacing = 0

        // alignment
        const alignment = 'justify'
        let spacing = 0
        switch (alignment) {
        case 'right':
          left += freeSpace
          break
        case 'center':
          left += width / 2 - (width - freeSpace) / 2
          break
        case 'justify':
          if (isLastLine && freeSpace / width > .2) {
            break
          }
          spacing = freeSpace / (line.length - 1)
          break
        }

        // render words
        chunk += ops.Tm(1, 0, 0, 1, left, y, x, height) // set pos
        if (spacing === 0) {
          chunk += ops.Tj(font.encode(line.map(w => w.w).join(' ')))
        } else {
          const arr = []
          line.forEach(w => {
            arr.push(
              font.encode(w.w),
              -(spacing + font.stringWidth(' ', fontSize)) * scaleFactor
            )
          })
          chunk += ops.TJ(arr)
        }

        // reset / update variables
        y -= height // shift y cursor
        spaceLeft = width
        line.length = 0 // empty line array
      } else {
        spaceLeft -= wordWidth
        line.push({ l: wordWidth, w: word })
      }

      // add trailing line breaks
      y -= font.lineHeight(fontSize, true) * lineHeight * linebreaks
    }

    chunk += ops.ET()
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

