'use strict'

const Cursor = require('./cursor')
const LineBreaker = require('linebreak')
const PDF = require('./object')
const Readable = require('stream').Readable
const ops = require('./ops')
const unorm = require('unorm')
const util = require('./util')
const uuid = require('node-uuid')
const version = require('../package.json').version

// constants
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
    this.width = opts.width || 595.296
    this.height = opts.height || 841.896

    this._nextObjectId = 1
    this._xref = new PDF.Xref()
    this._reading = false // wheater someone is reading data from the underlying Readable
    this._length = 0 // keeps track of the total document length (in byte)

    // header
    const header = `%PDF-${this.version}\n`
      // The PDF format mandates that we add at least 4 commented binary characters
      // (ASCII value >= 128), so that generic tools have a chance to detect
      // that it's a binary file
      + '%\xFF\xFF\xFF\xFF\n\n'

    // a backlog of pending operations
    this._pending = this._write(header)

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

  async _startPage() {
    const page = this._currentPage = new PDF.Page(this._pages, this._colorSpace)
    this._pages.add(this._currentPage)
    page.fonts.add(this.defaultFont.alias, this.defaultFont.object.toReference())

    this._pageContents = new PDF.Object()
    this._pageContents.content = new PDF.Array([])

    this._registerObject(this._pageContents)
    page.prop('Contents', this._pageContents.toReference())

    await this._startContentObject()
  }

  async _endPage() {
    if (!this._currentPage) {
      await this._startPage()
    }

    // run before break handlers
    await this._cursor.break()

    await this._endContentObject()
    await this._writeObject(this._pageContents)
    await this._writeObject(this._currentPage)

    // run before after handlers
    await this._cursor.prepare()
  }

  async _startContentObject() {
    // do not create new content object, if current content object is still empty
    if (this._length == this._contentStart) {
      return
    }

    if (this._content) {
      await this._endContentObject()
    }

    this._content = new PDF.Object()
    this._contentLength = new PDF.Object()

    this._registerObject(this._content)
    this._registerObject(this._contentLength)

    this._content.prop('Length', this._contentLength.toReference())

    this._xref.add(this._content.id, this._length, this._content)

    const ref = this._content.toReference()
    this._pageContents.content.push(ref)

    let chunk = this._content.id + ' ' + this._content.rev + ' obj\n'
      + this._content.properties.toString() + '\n'
      + 'stream\n'

    this._contentStart = this._length + chunk.length

    // set color space
    chunk += ops.CS('/CS1') + ops.cs('/CS1')
    await this._write(chunk)

    return ref
  }

  async _endContentObject() {
    if (!this._content) {
      return
    }

    this._contentLength.content = this._length - this._contentStart - 1
    if (this._contentLength.content < 0) {
      this._contentLength.content = 0
    }

    const chunk = 'endstream\nendobj\n\n'
    await this._write(chunk)
    await this._writeObject(this._contentLength)
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

    const fontSize = 20
    const lineHeight = 1//.15

    let beginText = ops.BT()
      // set current font and color
      + ops.Tf(font.alias, fontSize)
      + ops.SC(0, 0, 0)
    let endText = ops.ET()
    let isFirstLine = true

    const breaker = new LineBreaker(text)
    const line = []
    const scaleFactor = 1000 / fontSize
    let spaceLeft = this._cursor.width
    let last = 0, bk

    while ((bk = breaker.nextBreak()) || line.length > 0) {
      let linebreaks = 0
      let wordWidth = 0
      let word = null

      // when there is no break, there es an orphan word that just has to be rendered,
      // i.e., skip to the line rendering
      if (bk) {
        // get the string between the last break and this one
        word = text.slice(last, bk.position)

        // count linebreaks
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
        wordWidth = font.stringWidth(word, fontSize)
        // add whitespace length for every word, except the first on in the line
        if (line.length > 0) {
          wordWidth += font.stringWidth(' ', fontSize)
        }
      }

      // render line if there is a line break, if we hit the last word of the text, if we
      // have manual page breaks, or if there is not enough space on the line left
      const isLastWord = !bk || bk.position === text.length
      if ((bk && bk.required) || isLastWord || linebreaks > 0 || (spaceLeft - wordWidth) < 0) {
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
        const alignment = 'left'
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

      // consider word for next line
      if (word !== null) {
        line.push({ l: wordWidth, w: word })
        spaceLeft -= wordWidth
      }

      // add trailing line breaks
      linebreaks-- // there is one line break anyway, so reduce by one
      if (linebreaks > 0) {
        this._cursor.y -= font.lineHeight(fontSize, true) * lineHeight * linebreaks
      }
    }

    await this._write(endText)
  }

  cell(text, opts) {
    if (!opts || typeof opts !== 'object') {
      opts = {}
    }

    this._pending = this._pending.then(() => this._cell(text || '', opts))
  }

  async _cell(text, opts) {
    if (!this._currentPage) {
      await this._startPage()
    }

    // create new cursor for cell context
    const previousCursor = this._cursor
    // we only apply bottom padding for the most inner cell and therefore reset
    // the bottom padding of the parent cell here
    previousCursor.bottom = previousCursor.startY - previousCursor.height
    const currentCursor = this._cursor = this._cursor.clone()
    if ('width' in opts) {
      this._cursor.width = opts.width
    }
    const outerWidth = this._cursor.width
    let padding = 0
    if ('padding' in opts) {
      padding = opts.padding
    }

    if (padding > 0) {
      this._cursor.startX += padding
      this._cursor.x = this._cursor.startX
      this._cursor.y -= padding
      this._cursor.width -= 2 * padding
      this._cursor.bottom = this._cursor.startY - this._cursor.height + padding
    }

    // start a new content layer for cells
    // save the current layer ref, this will be used to place the background and border layer
    // after the cell has been rendered
    // Note: saving the index directly would  not work for nested rendering tasks
    let bgLayerRef = await this._startContentObject()

    // background creation callback
    const backgroundColor = util.colorToRgb(opts.backgroundColor)
    const createBackground = async () => {
      // apply bottom padding, but only for the most deep (when nesting e.g. cells) element
      if (this._cursor === currentCursor) {
        this._cursor.y -= padding
      }

      // if there is no backgroundColor, it is not necessary to create the background layer
      if (!backgroundColor) {
        return
      }

      // start a new content object for the background and border layer
      await this._startContentObject()

      // put the background layer behind the cell
      const layer = this._pageContents.content.pop()
      const bgLayerIndex = bgLayerRef ? this._pageContents.content.indexOf(bgLayerRef) : 0
      this._pageContents.content.splice(bgLayerIndex, 0, layer)

      // calculate background height
      let height = previousCursor.y - this._cursor.y
      if (previousCursor.y - height < previousCursor.bottom) {
        // if background height goes beyond bottom of document, trim it to the bottom
        height = previousCursor.y - previousCursor.bottom
      }

      // write background
      const chunk = ops.q() // save graphics state
        + ops.sc(backgroundColor[0], backgroundColor[1], backgroundColor[2]) // non-stroking color
        + ops.re(previousCursor.x, previousCursor.y - height, outerWidth, height) // rectangle
        + ops.f() // fill path
        + ops.Q() // restore graphics state
      await this._write(chunk)

      // for succeeding pages put background layers at index 0 (for bgLayerRef === null, index 0
      // will be used)
      bgLayerRef = null

      // update previousCursor to take page break into account
      previousCursor.y = previousCursor.startY
    }

    // create background on each page break
    this._cursor.beforeBreak(createBackground)

    // apply padding after page break
    this._cursor.afterBreak(() => {
      if (this._cursor === currentCursor) {
        this._cursor.y -= padding
        this._cursor.bottom += padding
      }
    })

    // render the cell's content
    if (typeof text === 'function') {
      await this._inner(text)
    } else {
      await this._text(text)
    }

    // create final createBackground
    await createBackground()

    // restore cursor
    previousCursor.y = this._cursor.y
    this._cursor = previousCursor
  }

  // wait until all rendering tasks inside the given function are finished
  async _inner(fn) {
    // save and reset current pending promise
    const pending = this._pending
    this._pending = RESOLVE
    // run function, which will update `this._pending` accordingly
    fn(this)
    // wait for all pending rendering tasks
    await this._pending
    // finally, reset back to the outer pending promise
    this._pending = pending
  }
}
