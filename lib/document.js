'use strict'

const Cursor = require('./cursor')
const Fragment = require('./fragment')
const ops = require('./ops')
const PDF = require('./object')
const Readable = require('stream').Readable
const uuid = require('node-uuid')
const version = require('../package.json').version
const PDFObject = require('./object/object')

// constants
const RESOLVE = Promise.resolve()

class Document extends Readable {
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
    this._pending = [
      () => this._write(header)
    ]
    // this is the current operation that is executed (operations are executed sequentially)
    this._pending.current = null

    // init default font
    this.defaultFont = opts.font
    this._fonts = {}
    this._pageFonts = {}
    this._registerFont(this.defaultFont)

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

    // start to work the _pending queue
    this._next()
  }

  /// private API

  _next() {
    // return if there is already an operation worked on
    if (this._pending.current) {
      return this._pending.current
    }

    // variables used to traverse the nested queue
    let parent = this._pending
    let next = parent[0]

    // if there is nothing in the queue, we are done here
    if (!next) {
      return RESOLVE
    }

    // the operation queue is a nested array, e.g.: [op1, [op2, op3, [ op4 ]], op5]
    // it is therefore necessary traverse the first element until the first non array element
    // is encountered
    while (Array.isArray(next)) {
      // if the first element is an empty array, remove it and start over
      if (next.length === 0) {
        parent.shift()
        return this._next()
      }

      parent = next
      next = next[0]
    }

    // remove next from the queue
    parent.shift()

    // TODO: still necessary?
    // if (!next) {
    //   return this._next()
    // }

    // return and set the current operation that is being executed
    return this._pending.current = next().then(() => {
      // once the execution finished, continue in the queue
      this._pending.current = null
      return this._next()
    })
  }

  // This is method is used by Node.js stream.Readable class, which we inherit from.
  // The method is called, if data is available from the resource, which means that we should
  // start pushing data into the read queue (using `this.push(dataChunk)`). It should continue
  // reading from the resoruce and pushing data until `this.push()` return `false`. Only when it
  // is called again aft it has stopped should it resume pushing additional data onto the
  // read queue.
  _read(/* size */) {
    this._reading = true
    this.emit('read')
  }

  // This method is used to push data onto the read queue. If the Readable stream is currently
  // not read from, the writing is postponed.
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

  async _useFont(font) {
    if (font.alias in this._pageFonts) {
      return
    }

    this._registerFont(font)
    this._pageFonts[font.alias] = this._fonts[font.alias].o.toReference()
  }

  async _startPage() {
    const page = this._currentPage = new PDF.Page(this._pages, this._colorSpace)
    this._pages.add(this._currentPage)

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

    for (const alias in this._pageFonts) {
      this._currentPage.fonts.add(alias, this._pageFonts[alias])
    }

    this._pageFonts = {}

    await this._endContentObject()
    await this._writeObject(this._pageContents)
    await this._writeObject(this._currentPage)

    // run before after handlers
    // await this._cursor.prepare()
  }

  async _pageBreak(/* level */) {
    if (!this._currentPage) {
      await this._startPage()
    }

    await this._cursor.reset()

    await this._endPage()
    await this._startPage()
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

  _registerFont(font) {
    if (font.alias in this._fonts) {
      return
    }

    const fontObj = new PDFObject('Font')
    this._fonts[font.alias] = { f: font, o: fontObj }
    this._registerObject(fontObj)
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

  // public API

  async sync() {
    await this._next()
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

    for (const alias in this._fonts) {
      const font = this._fonts[alias]
      await font.f.write(this, font.o)
    }

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

module.exports = class extends Fragment {
  constructor(opts) {
    const doc = new Document(opts)
    super(doc, doc)
  }

  get info() {
    return this._doc.info
  }

  pipe(dest, opts) {
    return this._doc.pipe(dest, opts)
  }

  sync() {
    return this._doc.sync()
  }

  end() {
    return this._doc.end()
  }
}
