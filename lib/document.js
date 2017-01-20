'use strict'

const Cursor = require('./cursor')
const Fragment = require('./fragment')
const ops = require('./ops')
const PDF = require('./object')
const Readable = require('stream').Readable
const uuid = require('node-uuid')
const version = require('../package.json').version

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
    this._pending.current = null

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

    this._next()
  }

  _next() {
    if (this._pending.current) {
      return this._pending.current
    }

    let parent = this._pending
    let next = parent[0]
    if (!next) {
      return RESOLVE
    }

    while (Array.isArray(next)) {
      if (next.length === 0) {
        parent.shift()
        return this._next()
      }

      parent = next
      next = next[0]
    }

    parent.shift()

    if (!next) {
      return this._next()
    }

    return this._pending.current = next().then(() => {
      this._pending.current = null
      return this._next()
    })
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

    await this._endContentObject()
    await this._writeObject(this._pageContents)
    await this._writeObject(this._currentPage)

    // run before after handlers
    // await this._cursor.prepare()
  }

  async _pageBreak() {
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

module.exports = class extends Fragment {
  constructor(opts) {
    const doc = new Document(opts)
    super(doc, doc)
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
