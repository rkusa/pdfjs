'use strict'

const Readable = require('stream').Readable
const PDFXref = require('./object/xref')
const PDFObject = require('./object/object')
const PDFName = require('./object/name')
const PDFArray = require('./object/array')
const PDFStream = require('./object/stream')
const PDFTrailer = require('./object/trailer')
const Pages = require('./object/pages')
const Page = require('./object/page')
const uuid = require('node-uuid')
const LineBreaker = require('linebreak')
const unorm = require('unorm')
const Cursor = require('./cursor')

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

    this.width = opts.width || 595.296
    this.height = opts.height || 841.896

    const padding = opts.padding || 20
    this.cursor = new Cursor(
      this.width - padding*2, this.height - padding*2, // width, height
      padding, this.height - padding // x, y
    )

    this.pages = new Pages(this.width, this.height)
    this.registerObject(this.pages)

    this.colorSpace = new PDFObject()
    const iccProfile = require('./sRGB_IEC61966-2-1_black_scaled')
    this.colorSpace.content = 'stream\n' + iccProfile + '\nendstream\n'
    this.colorSpace.prop('Length', iccProfile.length)
    this.colorSpace.prop('N', 3)
    this.colorSpace.prop('Alternate', 'DeviceRGB')
    // this.colorSpace.prop('Filter', new PDFArray([
    //   new PDFName('ASCII85Decode'), new PDFName('FlateDecode')
    // ]))
    this.colorSpace.prop('Filter', new PDFName('ASCII85Decode'))
    this.registerObject(this.colorSpace)

    this[READING] = false
    this.length = 0

    this.pending = this.write(createHeader(this))
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
    const page = this.currentPage = new Page(this.pages, this.colorSpace)
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
    if (!this.currentPage) {
      await this.startPage()
    }

    const length = this.length - this.pageStart - 1

    const page = this.currentPage
    page.length.content = length

    const chunk = 'endstream\nendobj\n\n'
    await this.write(chunk)
    await this.writeObject(page.length)
    await this.writeObject(page)

    this.cursor.reset()
  }

  text(text) {
    if (text) {
      this.pending = this.pending.then(() => createText.call(this, text))
    }
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

  async sync() {
    await this.pending
    this.pending = Promise.resolve()
  }

  async end() {
    await this.sync()
    await this.endPage()

    // for (const page of this.pages.pages) {
    //   // this.writeObject(page.contents.object)
    //   this.writeObject(page)
    // }
    await this.writeObject(this.pages)
    await this.writeObject(this.colorSpace)

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

async function createText(text) {
  if (!this.currentPage) {
    await this.startPage()
  }

  const font = this.defaultFont

  // enforce string
  text = String(text)

  let beginText = ops.BT()
    // set color space
    + ops.CS('/CS1')
    // set current font and color
    + ops.Tf(font.alias, 11)
    + ops.SC(0, 0, 0)
  let endText = ops.ET()
  let isFirstLine = true

  const lineHeight = 1//.15
  const breaker = new LineBreaker(text)
  const line = []
  const fontSize = 11
  const scaleFactor = 1000 / fontSize
  let spaceLeft = this.cursor.width
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

    spaceLeft -= wordWidth
    line.push({ l: wordWidth, w: word })

    const isLastWord = bk.position === text.length

    if (bk.required || isLastWord || linebreaks > 0 || (spaceLeft - wordWidth) < 0) {
      // render line
      let left = this.cursor.x

      // calc max line height
      // const height = Math.max.apply(Math,
      //   line.map(w => font.lineHeight(fontSize, true))
      // ) * lineHeight
      const height = font.lineHeight(fontSize, true) * lineHeight

      // break page if necessary
      if (!this.cursor.doesFit(height)) {
        if (!isFirstLine) {
          await this.write(endText)
        }
        await this.endPage()
        await this.startPage()
        isFirstLine = true
      }

      // shift cursor; since rendering is done above the y coordinate,
      // we have to update the cursor before rendering the line
      this.cursor.y -= height // shift y cursor

      // calculate remaining space
      // TODO use word specific font
      const freeSpace = spaceLeft
      // const freeSpace = this.cursor.width - line.map(w => w.l).reduce((l, r) => l + r, 0)

      let extraSpacing = 0

      // alignment
      const alignment = 'justify'
      let spacing = 0
      switch (alignment) {
      case 'right':
        left += freeSpace
        break
      case 'center':
        left += this.cursor.width / 2 - (this.cursor.width - freeSpace) / 2
        break
      case 'justify':
        const isLastLine = isLastWord || linebreaks > 0
        if (isLastLine && freeSpace / this.cursor.width > .2) {
          break
        }
        spacing = freeSpace / (line.length - 1)
        break
      }

      // render words
      let chunk = isFirstLine ? beginText : ''
      chunk += ops.Tm(1, 0, 0, 1, left, this.cursor.y, this.cursor.x, height) // set pos
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
      await this.write(chunk)

      const descent = font.lineDescent(fontSize)
      this.cursor.y += descent // add, because descent is negative

      // reset / update variables
      spaceLeft = this.cursor.width
      line.length = 0 // empty line array
    }

    // add trailing line breaks
    linebreaks-- // there is one line break anyway, so reduce by one
    if (linebreaks > 0) {
      this.cursor.y -= font.lineHeight(fontSize, true) * lineHeight * linebreaks
    }
  }

  await this.write(endText)
}