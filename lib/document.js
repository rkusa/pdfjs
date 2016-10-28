'use strict'

const Cursor = require('./cursor')
const LineBreaker = require('linebreak')
const ops = require('./ops')
const PDF = require('./object')
const Readable = require('stream').Readable
const unorm = require('unorm')
const uuid = require('node-uuid')
const version = require('../package.json').version

const RESOLVE = Promise.resolve()

class DocumentBase extends Readable {
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
    this.precision = 3
    this.width = opts.width || 595.296
    this.height = opts.height || 841.896

    this._nextObjectId = 1
    this._xref = new PDF.Xref()
    this._reading = false // wheater someone is reading data from the underlying Readable
    this._length = 0 // keeps track of the total document length (in byte)
    this._pending = this._write(createHeader(this)) // a backlog of pending operations

    // init default font
    this.defaultFont = opts.font
    this._registerObject(this.defaultFont.object)

    // init cursor
    const padding = opts.padding || 20
    this._cursor = new Cursor(
      this.width - padding*2, this.height - padding*2, // width, height
      padding, this.height - padding // x, y
    )

    // init pages catalog
    this._pages = new PDF.Pages(this.width, this.height)
    this._registerObject(this._pages)

    // init color space
    this._colorSpace = new PDF.Object()
    const iccProfile = require('./sRGB_IEC61966-2-1_black_scaled')
    this._colorSpace.content = 'stream\n' + iccProfile + '\nendstream\n'
    this._colorSpace.prop('Length', iccProfile.length)
    this._colorSpace.prop('N', 3)
    this._colorSpace.prop('Alternate', 'DeviceRGB')
    // this._colorSpace.prop('Filter', new PDF.Array([
    //   new PDF.Name('ASCII85Decode'), new PDF.Name('FlateDecode')
    // ]))
    this._colorSpace.prop('Filter', new PDF.Name('ASCII85Decode'))
    this._registerObject(this._colorSpace)
  }

  _read(/* size */) {
    this._reading = true
    this.emit('read')
  }

  _write(chunk) {
    if (this._reading) {
      if (!this.push(chunk, 'binary')) {
        this._reading = false
      }
      this._length += chunk.length
      return RESOLVE
    } else {
      return new Promise(resolve => {
        this.once('read', () => {
          resolve(this._write(chunk))
        })
      })
    }
  }

  // TODO: non public method
  async _startPage() {
    const page = this._currentPage = new PDF.Page(this._pages, this._colorSpace)
    this._pages.add(this._currentPage)
    this._currentPage.fonts.add(this.defaultFont.alias, this.defaultFont.object.toReference())

    this._registerObject(page.contents)
    this._registerObject(page.length)

    page.contents.prop('Length', page.length.toReference())

    this._xref.add(page.contents.id, this._length, page.contents)

    const chunk = page.contents.id + ' ' + page.contents.rev + ' obj\n'
      + page.contents.properties.toString() + '\n'
      + 'stream\n'

    this._pageStart = this._length + chunk.length
    await this._write(chunk)
  }

  async _endPage() {
    if (!this._currentPage) {
      await this._startPage()
    }

    const length = this._length - this._pageStart - 1

    const page = this._currentPage
    page.length.content = length

    const chunk = 'endstream\nendobj\n\n'
    await this._write(chunk)
    await this._writeObject(page.length)
    await this._writeObject(page)

    this._cursor.reset()
  }

  _registerObject(object) {
    if (object instanceof PDF.Stream) {
      object = object.object
    }

    object.id = this._nextObjectId
    this._nextObjectId++
  }

  _writeObject(object) {
    if (object instanceof PDF.Stream) {
      object = object.object
    }

    if (!object.id) {
      this._registerObject(object)
    }

    this._xref.add(object.id, this._length, object)
    return this._write(object.toString() + '\n\n')
  }

  async sync() {
    await this._pending
    this._pending = Promise.resolve()
  }

  async end() {
    await this.sync()
    await this._endPage()

    // for (const page of this._pages.pages) {
    //   // this._writeObject(page.contents.object)
    //   this._writeObject(page)
    // }
    await this._writeObject(this._pages)
    await this._writeObject(this._colorSpace)

    await this.defaultFont.write(this)

    const catalog = new PDF.Object('Catalog')
    catalog.prop('Pages', this._pages.toReference())
    await this._writeObject(catalog)

    // to support random access to individual objects, a PDF file
    // contains a cross-reference table that can be used to locate
    // and directly access pages and other important objects within the file
    const startxref = this._length
    await this._write(this._xref.toString())

    // trailer
    const objectsCount = this._nextObjectId - 1
    const trailer = new PDF.Trailer(objectsCount + 1, catalog, this.info)
    await this._write(trailer.toString() + '\n')

    // startxref
    await this._write('startxref\n' + startxref + '\n%%EOF')

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

module.exports = class Document extends DocumentBase {
  constructor(opts) {
    super(opts)
  }

  text(text) {
    if (text) {
      this._pending = this._pending.then(() => this._text(text))
    }
  }

  async _text(text) {
    if (!this._currentPage) {
      await this._startPage()
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
    let spaceLeft = this._cursor.width
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
        let left = this._cursor.x

        // calc max line height
        // const height = Math.max.apply(Math,
        //   line.map(w => font.lineHeight(fontSize, true))
        // ) * lineHeight
        const height = font.lineHeight(fontSize, true) * lineHeight

        // break page if necessary
        if (!this._cursor.doesFit(height)) {
          if (!isFirstLine) {
            await this._write(endText)
          }
          await this._endPage()
          await this._startPage()
          isFirstLine = true
        }

        // shift cursor; since rendering is done above the y coordinate,
        // we have to update the cursor before rendering the line
        this._cursor.y -= height // shift y cursor

        // calculate remaining space
        // TODO use word specific font
        const freeSpace = spaceLeft
        // const freeSpace = this._cursor.width - line.map(w => w.l).reduce((l, r) => l + r, 0)

        let extraSpacing = 0

        // alignment
        const alignment = 'justify'
        let spacing = 0
        switch (alignment) {
        case 'right':
          left += freeSpace
          break
        case 'center':
          left += this._cursor.width / 2 - (this._cursor.width - freeSpace) / 2
          break
        case 'justify':
          const isLastLine = isLastWord || linebreaks > 0
          if (isLastLine && freeSpace / this._cursor.width > .2) {
            break
          }
          spacing = freeSpace / (line.length - 1)
          break
        }

        // render words
        let chunk = isFirstLine ? beginText : ''
        chunk += ops.Tm(1, 0, 0, 1, left, this._cursor.y, this._cursor.x, height) // set pos
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
        await this._write(chunk)

        const descent = font.lineDescent(fontSize)
        this._cursor.y += descent // add, because descent is negative

        // reset / update variables
        spaceLeft = this._cursor.width
        line.length = 0 // empty line array
        isFirstLine = false
      }

      // add trailing line breaks
      linebreaks-- // there is one line break anyway, so reduce by one
      if (linebreaks > 0) {
        this._cursor.y -= font.lineHeight(fontSize, true) * lineHeight * linebreaks
      }
    }

    await this._write(endText)
  }
}