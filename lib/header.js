'use strict'

const Fragment = require('./fragment')
const util = require('./util')
const ops = require('./ops')
const PDF = require('./object')

module.exports = class Header extends Fragment {
  constructor(doc, parent) {
    super(doc, parent)

    this.width = this._cursor.width

    this._pageNumbers = []
  }

  /// private API

  async _pageBreak(level) {
    throw new Error('Header is to long (tried to execute a page break inside the header)')
  }

  async _start() {
    await this._doc._endPage()
    this._cursor.reset()

    this._resources = new PDF.Object()
    this._doc._registerObject(this._resources)
    this._bbox = new PDF.Object()
    this._doc._registerObject(this._bbox)

    this.fonts    = new PDF.Dictionary({})
    this.xobjects = new PDF.Dictionary({})

    this._objects = []

    this._doc._currentPage = this

    // close current content object
    await this._doc._startContentObject()
  }

  _createObject() {
    const xobj = new PDF.Object('XObject')
    xobj.prop('Subtype', 'Form')
    xobj.prop('FormType', 1)
    xobj.prop('BBox', this._bbox.toReference())
    xobj.prop('Resources', this._resources.toReference())
    return xobj
  }

  async write(doc) {
    this._resources.content = new PDF.Dictionary({
      ColorSpace: new PDF.Dictionary({
        CS1: new PDF.Array([new PDF.Name('ICCBased'), doc._colorSpace.toReference()]),
      }),
      ProcSet: new PDF.Array([
        new PDF.Name('PDF'),
        new PDF.Name('Text'),
        new PDF.Name('ImageB'),
        new PDF.Name('ImageC'),
        new PDF.Name('ImageI')
      ]),
      Font:    this.fonts,
      XObject: this.xobjects
    })

    await doc._writeObject(this._resources)

    this._bbox.content = new PDF.Array([0, this._cursor.startY, this.width, this._doc._cursor.y])

    await doc._writeObject(this._bbox)
  }

  async writePageNumbers() {
    if (this._pageNumbers.length === 0) {
      return
    }

    const Text = require('./text')

    for (const pos of this._pageNumbers) {
      let withPageCount = false
      if (pos.fn) {
        const lhs = pos.fn(1, 1)
        const rhs = pos.fn(1, 10)
        withPageCount = lhs.length !== rhs.length
      }

      // postpone writing page number until the end of the document, because the total page count
      // is not known now
      if (withPageCount) {
        const fonts = new PDF.Dictionary({})
        const font = pos.opts.font || this._doc.defaultFont
        const fontAlias = this._doc._useFont(font)
        fonts.set(fontAlias, this._doc._fonts[fontAlias].o.toReference())

        const xobj = new PDF.Object('XObject')
        xobj.prop('Subtype', 'Form')
        xobj.prop('FormType', 1)
        xobj.prop('BBox', new PDF.Array([pos.x, pos.y, pos.x + pos.width, pos.y - pos.height]))
        xobj.prop('Resources', new PDF.Dictionary({
          ColorSpace: new PDF.Dictionary({
            CS1: new PDF.Array([new PDF.Name('ICCBased'), this._doc._colorSpace.toReference()]),
          }),
          ProcSet: new PDF.Array([new PDF.Name('Text')]),
          Font:    fonts,
        }))

        this._doc._registerObject(xobj)

        const currentPage = this._doc._pages.pages.length

        this._doc._finalize.push(async () => {
          await this._doc._startContentObject(xobj)

          this._cursor.reset()
          this._cursor.y = pos.y //- pos.height
          this._cursor.x = pos.x
          this._cursor.width = pos.width

          const txt = new Text(this._doc, this, pos.opts)
          txt._parts++
          txt._ended = true
          await txt._start()

          const pageCount =  this._doc._pages.pages.length
          const str = pos.fn ? pos.fn(currentPage, pageCount) : currentPage
          await txt._render(str, pos.opts)
          await txt._end()

          await this._doc._endContentObject()
        })

        const alias = new PDF.Name('X' + this._doc._nextXObjectId++)
        this._doc._currentContent._xobjects[alias] = xobj.toReference()
        await this._doc._write(ops.Do(alias))
      } else {
        // if there is now total page count necessary, we can write the current page number directly
        this._cursor.y = pos.y
        this._cursor.x = pos.x
        this._cursor.width = pos.width

        const txt = new Text(this._doc, this, pos.opts)
        txt._parts++
        txt._ended = true
        await txt._start()
        await txt._render(String(this._doc._pages.pages.length), pos.opts)
        await txt._end()
      }
    }
  }

  async _end() {
    this.height = this._doc._cursor.startY - this._doc._cursor.y

    await this._doc._endContentObject()

    for (const content of this._doc._contents) {
      for (const alias in content._fonts) {
        this.fonts.add(alias, content._fonts[alias])
      }

      for (const alias in content._xobjects) {
        this.xobjects.add(alias, content._xobjects[alias])
      }
    }

    await this.write(this._doc)
    this._doc._cursor.reset()

    this._objects = this._doc._contents.map(c => c._object)

    this._doc._currentContent = null
    this._doc._contents.length = 0

    this._doc._currentPage = null
  }

  /// public API

  pageNumber(fn, opts) {
    if (typeof fn === 'object') {
      opts = fn
      fn = undefined
    }

    if (!opts || typeof opts !== 'object') {
      opts = {}
    }

    const font = opts.font || this._doc.defaultFont
    const fontSize = opts.fontSize || this._doc.defaultFontSize

    const height = font.lineHeight(fontSize, true)
    const descent = -font.lineDescent(fontSize)

    this._pageNumbers.push({
      y: this._cursor.y - height + descent,
      x: this._cursor.x,
      width: this._cursor.width,
      height: height + descent,
      opts: opts,
      fn: fn
    })

    this._begin(null)
    this._pending.push(() => {
      this._cursor.y -= height + descent
      return Promise.resolve()
    })
  }
}
